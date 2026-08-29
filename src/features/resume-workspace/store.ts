import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import {
    createInitialWorkspaceSnapshot,
    defaultIdFactory,
    defaultNow,
    getCompletion,
    getDashboardSummaries,
    getNavigation,
    getPreviewRenderModel,
    normalizeResumeDocument,
    reduceWorkspace,
    snapshotsEqual,
    type BuiltInSectionId,
    type CreateDocumentInput,
    type DocumentPatch,
    type IdFactory,
    type NormalizationOptions,
    type PersistenceState,
    type RepeatableEntryInput,
    type RepeatableSection,
    type ResumeDocument,
    type ResumeSettings,
    type ResumeStep,
    type WorkspaceCommand,
    type WorkspaceReducerDependencies,
    type WorkspaceSettings,
    type WorkspaceSnapshot,
} from "./model";
import {
    createLocalStoragePersistence,
    deserializeDocument,
    deserializeWorkspace,
    encodeDocument,
    encodeWorkspace,
    type PersistenceAdapter,
    type PersistedWorkspace,
} from "./persistence";

export interface WorkspaceHistory {
    past: WorkspaceSnapshot[];
    future: WorkspaceSnapshot[];
}

export interface ResumeWorkspaceActions {
    dispatch(command: WorkspaceCommand): void;
    createDocument(input?: CreateDocumentInput): string;
    selectDocument(documentId: string | null): void;
    updateDocument(patch: DocumentPatch, documentId?: string): void;
    deleteDocument(documentId: string): void;
    duplicateDocument(documentId?: string): string | null;

    addSection(sectionId: BuiltInSectionId): void;
    removeSection(sectionId: BuiltInSectionId): void;
    renameSection(sectionId: BuiltInSectionId, title: string): void;
    reorderSections(fromIndex: number, toIndex: number): void;

    createEntry(section: RepeatableSection, entry?: RepeatableEntryInput): string | null;
    updateEntry(
        section: RepeatableSection,
        entryId: string,
        patch: Record<string, unknown>
    ): void;
    deleteEntry(section: RepeatableSection, entryId: string): void;
    duplicateEntry(section: RepeatableSection, entryId: string): string | null;
    reorderEntries(section: RepeatableSection, fromIndex: number, toIndex: number): void;

    createLink(link?: { id?: string; title?: string; url?: string }): string | null;
    updateLink(linkId: string, patch: { title?: string; url?: string }): void;
    deleteLink(linkId: string): void;
    reorderLinks(fromIndex: number, toIndex: number): void;
    createProjectLink(
        projectId: string,
        link?: { id?: string; title?: string; url?: string }
    ): string | null;
    updateProjectLink(
        projectId: string,
        linkId: string,
        patch: { title?: string; url?: string }
    ): void;
    deleteProjectLink(projectId: string, linkId: string): void;
    reorderProjectLinks(projectId: string, fromIndex: number, toIndex: number): void;

    updateSettings(patch: Partial<WorkspaceSettings>): void;
    updateDocumentSettings(patch: Partial<ResumeSettings>): void;
    setCurrentStep(step: ResumeStep): void;
    setSectionVisibility(sectionId: BuiltInSectionId, visible: boolean): void;

    undo(): void;
    redo(): void;
    clearHistory(): void;

    hydrate(): Promise<void>;
    saveNow(): Promise<void>;
    flushSave(): Promise<void>;
    exportDocument(documentId?: string): string | null;
    exportWorkspace(): string;
    importDocument(payload: unknown, options?: { select?: boolean }): string | null;
    importWorkspace(payload: unknown): boolean;
}

export interface WorkspaceState extends WorkspaceSnapshot {
    history: WorkspaceHistory;
    persistence: PersistenceState;
    actions: ResumeWorkspaceActions;
}

export interface CreateResumeWorkspaceOptions {
    persistence?: PersistenceAdapter | null;
    idFactory?: IdFactory;
    now?: () => string;
    sanitizer?: NormalizationOptions["sanitizer"];
    historyLimit?: number;
    autoHydrate?: boolean;
    autosaveDebounceMs?: number;
}

const snapshotFromState = (state: WorkspaceState): WorkspaceSnapshot => ({
    documents: state.documents,
    activeDocumentId: state.activeDocumentId,
    currentStep: state.currentStep,
    settings: state.settings,
});

const persistenceIdle = (): PersistenceState => ({
    hydration: "idle",
    save: "idle",
    lastSavedAt: null,
    error: null,
});

/**
 * Create an isolated store (useful for tests and embedded editors).  The app
 * exports one singleton below; React components should use its selectors and
 * actions instead of maintaining another editable profile object.
 */
export const createResumeWorkspaceStore = (
    options: CreateResumeWorkspaceOptions = {}
): StoreApi<WorkspaceState> => {
    const idFactory = options.idFactory ?? defaultIdFactory;
    const now = options.now ?? defaultNow;
    const historyLimit = Math.max(1, options.historyLimit ?? 100);
    const persistence =
        options.persistence === undefined
            ? createLocalStoragePersistence({ idFactory, now })
            : options.persistence;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let saveRevision = 0;
    let mutationRevision = 0;
    let saveChain: Promise<void> = Promise.resolve();
    let hydrationPromise: Promise<void> | null = null;
    let store: StoreApi<WorkspaceState>;

    const dependencies: WorkspaceReducerDependencies = {
        idFactory,
        now,
        sanitizer: options.sanitizer,
    };

    const scheduleSave = () => {
        const state = store.getState();
        saveRevision += 1;
        if (!persistence || !state.settings.autosave) {
            if (saveTimer !== null) {
                clearTimeout(saveTimer);
                saveTimer = null;
            }
            return;
        }
        store.setState({
            persistence: {
                ...state.persistence,
                save: "pending",
                error: null,
            },
        });
        if (saveTimer !== null) clearTimeout(saveTimer);
        const delay = Math.max(
            0,
            state.settings.autosaveDebounceMs ?? options.autosaveDebounceMs ?? 500
        );
        saveTimer = setTimeout(() => {
            saveTimer = null;
            void saveNow().catch(() => undefined);
        }, delay);
    };

    const commitSnapshot = (next: WorkspaceSnapshot, recordHistory = true) => {
        const current = snapshotFromState(store.getState());
        if (snapshotsEqual(current, next)) return false;
        const state = store.getState();
        const history = recordHistory
            ? {
                  past: [
                      ...state.history.past,
                      JSON.parse(JSON.stringify(current)) as WorkspaceSnapshot,
                  ].slice(-historyLimit),
                  future: [],
              }
            : state.history;
        mutationRevision += 1;
        store.setState({ ...next, history });
        scheduleSave();
        return true;
    };

    const dispatch = (command: WorkspaceCommand) => {
        const next = reduceWorkspace(snapshotFromState(store.getState()), command, dependencies);
        commitSnapshot(next);
    };

    const saveNow = async (): Promise<void> => {
        if (!persistence) return;
        if (saveTimer !== null) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        const revision = saveRevision;
        const payload = serializeSnapshotForPersistence(
            snapshotFromState(store.getState()),
            now()
        );
        const previous = store.getState().persistence;
        store.setState({
            persistence: { ...previous, save: "saving", error: null },
        });
        saveChain = saveChain
            .catch(() => undefined)
            .then(async () => {
                await persistence.write(payload);
                if (revision === saveRevision) {
                    const completedAt = now();
                    store.setState((state) => ({
                        persistence: {
                            ...state.persistence,
                            save: "saved",
                            lastSavedAt: completedAt,
                            error: null,
                        },
                    }));
                }
            })
            .catch((error: unknown) => {
                if (revision === saveRevision) {
                    store.setState((state) => ({
                        persistence: {
                            ...state.persistence,
                            save: "error",
                            error: error instanceof Error ? error.message : String(error),
                        },
                    }));
                }
                throw error;
            });
        await saveChain;
    };

    const hydrate = (): Promise<void> => {
        if (hydrationPromise) return hydrationPromise;
        if (store.getState().persistence.hydration === "hydrated") {
            return Promise.resolve();
        }
        const startedAtMutation = mutationRevision;
        hydrationPromise = (async () => {
            if (!persistence) {
                store.setState((state) => ({
                    persistence: { ...state.persistence, hydration: "hydrated" },
                }));
                return;
            }
            store.setState((state) => ({
                persistence: {
                    ...state.persistence,
                    hydration: "hydrating",
                    error: null,
                },
            }));
            try {
                const value = await persistence.read();
                const parsed = deserializeWorkspace(value, {
                    idFactory,
                    now,
                    sanitizer: options.sanitizer,
                    preserveEmptyEntries: true,
                });
                if (parsed) {
                    const state = store.getState();
                    if (mutationRevision === startedAtMutation) {
                        store.setState({
                            ...parsed,
                            history: { past: [], future: [] },
                            persistence: {
                                ...state.persistence,
                                hydration: "hydrated",
                                save: "saved",
                                error: null,
                            },
                        });
                    } else {
                        const current = snapshotFromState(state);
                        const documents = {
                            ...parsed.documents,
                            ...current.documents,
                        };
                        const activeDocumentId =
                            current.activeDocumentId ?? parsed.activeDocumentId;
                        const activeDocument = activeDocumentId
                            ? documents[activeDocumentId]
                            : null;
                        store.setState({
                            documents,
                            activeDocumentId,
                            currentStep:
                                activeDocument?.meta.step ?? "personal-info",
                            settings: current.settings,
                            history: state.history,
                            persistence: {
                                ...state.persistence,
                                hydration: "hydrated",
                                error: null,
                            },
                        });
                        scheduleSave();
                    }
                } else {
                    store.setState((state) => ({
                        persistence: {
                            ...state.persistence,
                            hydration: "hydrated",
                            error: null,
                        },
                    }));
                }
            } catch (error: unknown) {
                store.setState((state) => ({
                    persistence: {
                        ...state.persistence,
                        hydration: "error",
                        error:
                            error instanceof Error ? error.message : String(error),
                    },
                }));
            }
        })().finally(() => {
            hydrationPromise = null;
        });
        return hydrationPromise;
    };

    const undo = () => {
        const state = store.getState();
        const previous = state.history.past[state.history.past.length - 1];
        if (!previous) return;
        const current = snapshotFromState(state);
        mutationRevision += 1;
        store.setState({
            ...previous,
            history: {
                past: state.history.past.slice(0, -1),
                future: [
                    ...state.history.future,
                    JSON.parse(JSON.stringify(current)) as WorkspaceSnapshot,
                ].slice(-historyLimit),
            },
        });
        scheduleSave();
    };

    const redo = () => {
        const state = store.getState();
        const next = state.history.future[state.history.future.length - 1];
        if (!next) return;
        const current = snapshotFromState(state);
        mutationRevision += 1;
        store.setState({
            ...next,
            history: {
                past: [
                    ...state.history.past,
                    JSON.parse(JSON.stringify(current)) as WorkspaceSnapshot,
                ].slice(-historyLimit),
                future: state.history.future.slice(0, -1),
            },
        });
        scheduleSave();
    };

    const actions: ResumeWorkspaceActions = {
        dispatch,
        createDocument(input) {
            dispatch({ type: "document/create", document: input });
            return store.getState().activeDocumentId ?? "";
        },
        selectDocument(documentId) {
            dispatch({ type: "document/select", documentId });
        },
        updateDocument(patch, documentId) {
            dispatch({ type: "document/update", patch, documentId });
        },
        deleteDocument(documentId) {
            dispatch({ type: "document/delete", documentId });
        },
        duplicateDocument(documentId) {
            const sourceId = documentId ?? store.getState().activeDocumentId;
            if (!sourceId) return null;
            dispatch({ type: "document/duplicate", documentId: sourceId });
            return store.getState().activeDocumentId;
        },
        addSection(sectionId) {
            dispatch({ type: "section/add", sectionId });
        },
        removeSection(sectionId) {
            dispatch({ type: "section/remove", sectionId });
        },
        renameSection(sectionId, title) {
            dispatch({ type: "section/rename", sectionId, title });
        },
        reorderSections(fromIndex, toIndex) {
            dispatch({ type: "section/reorder", fromIndex, toIndex });
        },
        createEntry(section, entry) {
            const before = store.getState().documents[store.getState().activeDocumentId ?? ""];
            dispatch({ type: "entry/create", section, entry });
            const after = store.getState().documents[store.getState().activeDocumentId ?? ""];
            const beforeIds = new Set((before?.[section] as { id: string }[] | undefined)?.map((item) => item.id));
            return (
                (after?.[section] as { id: string }[] | undefined)?.find(
                    (item) => !beforeIds.has(item.id)
                )?.id ?? null
            );
        },
        updateEntry(section, entryId, patch) {
            dispatch({ type: "entry/update", section, entryId, patch });
        },
        deleteEntry(section, entryId) {
            dispatch({ type: "entry/delete", section, entryId });
        },
        duplicateEntry(section, entryId) {
            const before = store.getState().documents[store.getState().activeDocumentId ?? ""];
            dispatch({ type: "entry/duplicate", section, entryId });
            const after = store.getState().documents[store.getState().activeDocumentId ?? ""];
            const beforeIds = new Set((before?.[section] as { id: string }[] | undefined)?.map((item) => item.id));
            return (
                (after?.[section] as { id: string }[] | undefined)?.find(
                    (item) => !beforeIds.has(item.id)
                )?.id ?? null
            );
        },
        reorderEntries(section, fromIndex, toIndex) {
            dispatch({ type: "entry/reorder", section, fromIndex, toIndex });
        },
        createLink(link) {
            const before = store.getState().documents[store.getState().activeDocumentId ?? ""];
            dispatch({ type: "personal-link/create", link });
            const after = store.getState().documents[store.getState().activeDocumentId ?? ""];
            const beforeIds = new Set(before?.personalInfo.titleLinks.map((item) => item.id));
            return after?.personalInfo.titleLinks.find((item) => !beforeIds.has(item.id))?.id ?? null;
        },
        updateLink(linkId, patch) {
            dispatch({ type: "personal-link/update", linkId, patch });
        },
        deleteLink(linkId) {
            dispatch({ type: "personal-link/delete", linkId });
        },
        reorderLinks(fromIndex, toIndex) {
            dispatch({ type: "personal-link/reorder", fromIndex, toIndex });
        },
        createProjectLink(projectId, link) {
            const before = store.getState().documents[store.getState().activeDocumentId ?? ""];
            dispatch({ type: "project-link/create", projectId, link });
            const after = store.getState().documents[store.getState().activeDocumentId ?? ""];
            const beforeProject = before?.projects.find((item) => item.id === projectId);
            const afterProject = after?.projects.find((item) => item.id === projectId);
            const beforeIds = new Set(beforeProject?.links.map((item) => item.id));
            return afterProject?.links.find((item) => !beforeIds.has(item.id))?.id ?? null;
        },
        updateProjectLink(projectId, linkId, patch) {
            dispatch({ type: "project-link/update", projectId, linkId, patch });
        },
        deleteProjectLink(projectId, linkId) {
            dispatch({ type: "project-link/delete", projectId, linkId });
        },
        reorderProjectLinks(projectId, fromIndex, toIndex) {
            dispatch({ type: "project-link/reorder", projectId, fromIndex, toIndex });
        },
        updateSettings(patch) {
            dispatch({ type: "settings/update", patch });
        },
        updateDocumentSettings(patch) {
            dispatch({ type: "document/settings/update", patch });
        },
        setCurrentStep(step) {
            dispatch({ type: "step/set", step });
        },
        setSectionVisibility(sectionId, visible) {
            dispatch({ type: "section/visibility", sectionId, visible });
        },
        undo,
        redo,
        clearHistory() {
            store.setState({
                history: { past: [], future: [] },
            });
        },
        hydrate,
        saveNow,
        async flushSave() {
            if (saveTimer !== null) {
                clearTimeout(saveTimer);
                saveTimer = null;
                await saveNow();
            } else {
                await saveChain;
            }
        },
        exportDocument(documentId) {
            const id = documentId ?? store.getState().activeDocumentId;
            const document = id ? store.getState().documents[id] : undefined;
            return document ? encodeDocument(document, now()) : null;
        },
        exportWorkspace() {
            return encodeWorkspace(snapshotFromState(store.getState()), now());
        },
        importDocument(payload, importOptions = {}) {
            const document = deserializeDocument(payload, {
                idFactory,
                now,
                sanitizer: options.sanitizer,
                preserveEmptyEntries: true,
            });
            if (!document) return null;
            let id = document.meta.id;
            while (store.getState().documents[id]) id = idFactory("document");
            const imported = normalizeResumeDocument(
                { ...document, meta: { ...document.meta, id } },
                { idFactory, now, sanitizer: options.sanitizer, preserveEmptyEntries: true }
            );
            const state = store.getState();
            commitSnapshot({
                ...snapshotFromState(state),
                documents: { ...state.documents, [id]: imported },
                activeDocumentId: importOptions.select === false ? state.activeDocumentId : id,
                currentStep:
                    importOptions.select === false
                        ? state.currentStep
                        : imported.meta.step,
            });
            return id;
        },
        importWorkspace(payload) {
            const parsed = deserializeWorkspace(payload, {
                idFactory,
                now,
                sanitizer: options.sanitizer,
                preserveEmptyEntries: true,
            });
            if (!parsed) return false;
            commitSnapshot(parsed);
            return true;
        },
    };

    const initial = createInitialWorkspaceSnapshot();
    if (options.autosaveDebounceMs !== undefined) {
        initial.settings.autosaveDebounceMs = Math.max(0, options.autosaveDebounceMs);
    }
    store = createStore<WorkspaceState>(() => ({
        ...initial,
        history: { past: [], future: [] },
        persistence: persistenceIdle(),
        actions,
    }));

    if (options.autoHydrate !== false) {
        void hydrate();
    }
    return store;
};

const serializeSnapshotForPersistence = (
    snapshot: WorkspaceSnapshot,
    savedAt: string
): PersistedWorkspace => {
    // Import through the public encoder to keep the storage contract in one
    // place.  The JSON round trip also ensures no action references leak.
    const encoded = encodeWorkspace(snapshot, savedAt);
    return JSON.parse(encoded) as PersistedWorkspace;
};

export type ResumeWorkspaceStore = StoreApi<WorkspaceState>;

/** The one app-wide store. */
export const resumeWorkspaceStore = createResumeWorkspaceStore();

export const useResumeWorkspace = <T = WorkspaceState>(
    selector: (state: WorkspaceState) => T = (state) => state as T
): T => useStore(resumeWorkspaceStore, selector);

export const useActiveResumeDocument = (): ResumeDocument | null =>
    useResumeWorkspace((state) =>
        state.activeDocumentId
            ? state.documents[state.activeDocumentId] ?? null
            : null
    );

export const useResumeActions = (): ResumeWorkspaceActions =>
    useResumeWorkspace((state) => state.actions);

// Selector helpers are kept here as a convenience for React callers.  They
// derive from the canonical document, never from component-local copies.
export const selectActiveResumeDocument = (state: WorkspaceState): ResumeDocument | null =>
    state.activeDocumentId ? state.documents[state.activeDocumentId] ?? null : null;

const completionCache = new WeakMap<
    ResumeDocument,
    ReturnType<typeof getCompletion>
>();
const navigationCache = new WeakMap<
    ResumeDocument,
    Map<ResumeStep, ReturnType<typeof getNavigation>>
>();
const previewCache = new WeakMap<
    ResumeDocument,
    ReturnType<typeof getPreviewRenderModel>
>();
let dashboardDocuments: WorkspaceState["documents"] | null = null;
let dashboardActiveId: string | null = null;
let dashboardValue: ReturnType<typeof getDashboardSummaries> = [];

export const selectCompletion = (state: WorkspaceState) => {
    const document = selectActiveResumeDocument(state);
    if (!document) return null;
    const cached = completionCache.get(document);
    if (cached) return cached;
    const completion = getCompletion(document);
    completionCache.set(document, completion);
    return completion;
};

export const selectNavigation = (state: WorkspaceState) => {
    const document = selectActiveResumeDocument(state);
    if (!document) return null;
    let byStep = navigationCache.get(document);
    if (!byStep) {
        byStep = new Map();
        navigationCache.set(document, byStep);
    }
    const cached = byStep.get(state.currentStep);
    if (cached) return cached;
    const navigation = getNavigation(document, state.currentStep);
    byStep.set(state.currentStep, navigation);
    return navigation;
};

export const selectDashboardSummaries = (state: WorkspaceState) => {
    if (
        dashboardDocuments === state.documents &&
        dashboardActiveId === state.activeDocumentId
    ) {
        return dashboardValue;
    }
    dashboardDocuments = state.documents;
    dashboardActiveId = state.activeDocumentId;
    dashboardValue = getDashboardSummaries(state);
    return dashboardValue;
};

export const selectPreviewRenderModel = (state: WorkspaceState) => {
    const document = selectActiveResumeDocument(state);
    if (!document) return null;
    const cached = previewCache.get(document);
    if (cached) return cached;
    const preview = getPreviewRenderModel(document);
    previewCache.set(document, preview);
    return preview;
};
