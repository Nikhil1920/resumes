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
    /**
     * Run several actions as one undoable change.  Nested batches fold into
     * the outermost one; the callback must be synchronous.
     */
    batch<T>(run: () => T): T;
    createDocument(input?: CreateDocumentInput): string;
    selectDocument(documentId: string | null): void;
    updateDocument(patch: DocumentPatch, documentId?: string): void;
    deleteDocument(documentId: string): void;
    duplicateDocument(documentId?: string): string | null;

    // Every document-scoped action takes an optional trailing documentId and
    // otherwise acts on the active document.
    addSection(sectionId: BuiltInSectionId, documentId?: string): void;
    removeSection(sectionId: BuiltInSectionId, documentId?: string): void;
    renameSection(sectionId: BuiltInSectionId, title: string, documentId?: string): void;
    reorderSections(fromIndex: number, toIndex: number, documentId?: string): void;
    setSectionOrder(order: BuiltInSectionId[], documentId?: string): void;

    createEntry(
        section: RepeatableSection,
        entry?: RepeatableEntryInput,
        documentId?: string
    ): string | null;
    updateEntry(
        section: RepeatableSection,
        entryId: string,
        patch: Record<string, unknown>,
        documentId?: string
    ): void;
    deleteEntry(section: RepeatableSection, entryId: string, documentId?: string): void;
    duplicateEntry(
        section: RepeatableSection,
        entryId: string,
        documentId?: string
    ): string | null;
    reorderEntries(
        section: RepeatableSection,
        fromIndex: number,
        toIndex: number,
        documentId?: string
    ): void;

    createLink(
        link?: { id?: string; title?: string; url?: string },
        documentId?: string
    ): string | null;
    updateLink(linkId: string, patch: { title?: string; url?: string }, documentId?: string): void;
    deleteLink(linkId: string, documentId?: string): void;
    reorderLinks(fromIndex: number, toIndex: number, documentId?: string): void;
    createProjectLink(
        projectId: string,
        link?: { id?: string; title?: string; url?: string },
        documentId?: string
    ): string | null;
    updateProjectLink(
        projectId: string,
        linkId: string,
        patch: { title?: string; url?: string },
        documentId?: string
    ): void;
    deleteProjectLink(projectId: string, linkId: string, documentId?: string): void;
    reorderProjectLinks(
        projectId: string,
        fromIndex: number,
        toIndex: number,
        documentId?: string
    ): void;

    updateSettings(patch: Partial<WorkspaceSettings>): void;
    updateDocumentSettings(patch: Partial<ResumeSettings>, documentId?: string): void;
    /** Navigation only: changes the step without adding an undo entry. */
    setCurrentStep(step: ResumeStep): void;
    setSectionVisibility(
        sectionId: BuiltInSectionId,
        visible: boolean,
        documentId?: string
    ): void;

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

    // While a batch runs, only the snapshot before its first recorded change is
    // kept; it becomes the batch's single undo entry when the batch ends.
    let batchDepth = 0;
    let batchBase: WorkspaceSnapshot | null = null;

    const pushHistory = (snapshot: WorkspaceSnapshot) => {
        const state = store.getState();
        store.setState({
            history: {
                past: [
                    ...state.history.past,
                    JSON.parse(JSON.stringify(snapshot)) as WorkspaceSnapshot,
                ].slice(-historyLimit),
                future: [],
            },
        });
    };

    const commitSnapshot = (next: WorkspaceSnapshot, recordHistory = true) => {
        const current = snapshotFromState(store.getState());
        if (snapshotsEqual(current, next)) return false;
        if (recordHistory) {
            if (batchDepth > 0) {
                batchBase ??= JSON.parse(JSON.stringify(current)) as WorkspaceSnapshot;
            } else {
                pushHistory(current);
            }
        }
        mutationRevision += 1;
        store.setState({ ...next });
        scheduleSave();
        return true;
    };

    const dispatch = (command: WorkspaceCommand, recordHistory = true) => {
        const next = reduceWorkspace(snapshotFromState(store.getState()), command, dependencies);
        commitSnapshot(next, recordHistory);
    };

    const batch = <T,>(run: () => T): T => {
        batchDepth += 1;
        try {
            return run();
        } finally {
            batchDepth -= 1;
            if (batchDepth === 0 && batchBase) {
                const base = batchBase;
                batchBase = null;
                pushHistory(base);
            }
        }
    };

    const targetDocument = (documentId?: string) => {
        const state = store.getState();
        const id = documentId ?? state.activeDocumentId;
        return id ? state.documents[id] : undefined;
    };

    /** Dispatch a create-style command and return the id it added to `list`. */
    const createAndFindId = (
        command: WorkspaceCommand,
        documentId: string | undefined,
        list: (document: ResumeDocument) => ReadonlyArray<{ id: string }> | undefined
    ): string | null => {
        const id = documentId ?? store.getState().activeDocumentId ?? undefined;
        const before = targetDocument(id);
        dispatch(command);
        const after = targetDocument(id);
        const beforeIds = new Set((before ? list(before) : undefined)?.map((item) => item.id));
        return (after ? list(after) : undefined)?.find((item) => !beforeIds.has(item.id))?.id ?? null;
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
        dispatch: (command) => dispatch(command),
        batch,
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
        addSection(sectionId, documentId) {
            dispatch({ type: "section/add", sectionId, documentId });
        },
        removeSection(sectionId, documentId) {
            dispatch({ type: "section/remove", sectionId, documentId });
        },
        renameSection(sectionId, title, documentId) {
            dispatch({ type: "section/rename", sectionId, title, documentId });
        },
        reorderSections(fromIndex, toIndex, documentId) {
            dispatch({ type: "section/reorder", fromIndex, toIndex, documentId });
        },
        setSectionOrder(order, documentId) {
            dispatch({ type: "section/set-order", order, documentId });
        },
        createEntry(section, entry, documentId) {
            return createAndFindId(
                { type: "entry/create", section, entry, documentId },
                documentId,
                (document) => document[section]
            );
        },
        updateEntry(section, entryId, patch, documentId) {
            dispatch({ type: "entry/update", section, entryId, patch, documentId });
        },
        deleteEntry(section, entryId, documentId) {
            dispatch({ type: "entry/delete", section, entryId, documentId });
        },
        duplicateEntry(section, entryId, documentId) {
            return createAndFindId(
                { type: "entry/duplicate", section, entryId, documentId },
                documentId,
                (document) => document[section]
            );
        },
        reorderEntries(section, fromIndex, toIndex, documentId) {
            dispatch({ type: "entry/reorder", section, fromIndex, toIndex, documentId });
        },
        createLink(link, documentId) {
            return createAndFindId(
                { type: "personal-link/create", link, documentId },
                documentId,
                (document) => document.personalInfo.titleLinks
            );
        },
        updateLink(linkId, patch, documentId) {
            dispatch({ type: "personal-link/update", linkId, patch, documentId });
        },
        deleteLink(linkId, documentId) {
            dispatch({ type: "personal-link/delete", linkId, documentId });
        },
        reorderLinks(fromIndex, toIndex, documentId) {
            dispatch({ type: "personal-link/reorder", fromIndex, toIndex, documentId });
        },
        createProjectLink(projectId, link, documentId) {
            return createAndFindId(
                { type: "project-link/create", projectId, link, documentId },
                documentId,
                (document) => document.projects.find((item) => item.id === projectId)?.links
            );
        },
        updateProjectLink(projectId, linkId, patch, documentId) {
            dispatch({ type: "project-link/update", projectId, linkId, patch, documentId });
        },
        deleteProjectLink(projectId, linkId, documentId) {
            dispatch({ type: "project-link/delete", projectId, linkId, documentId });
        },
        reorderProjectLinks(projectId, fromIndex, toIndex, documentId) {
            dispatch({ type: "project-link/reorder", projectId, fromIndex, toIndex, documentId });
        },
        updateSettings(patch) {
            dispatch({ type: "settings/update", patch });
        },
        updateDocumentSettings(patch, documentId) {
            dispatch({ type: "document/settings/update", patch, documentId });
        },
        setCurrentStep(step) {
            dispatch({ type: "step/set", step }, false);
        },
        setSectionVisibility(sectionId, visible, documentId) {
            dispatch({ type: "section/visibility", sectionId, visible, documentId });
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
