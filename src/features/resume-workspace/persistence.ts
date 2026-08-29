import {
    WORKSPACE_SCHEMA_VERSION,
    cleanResumeDocument,
    createInitialWorkspaceSnapshot,
    defaultIdFactory,
    type IdFactory,
    type NormalizationOptions,
    normalizeResumeDocument,
    type ResumeDocument,
    type WorkspaceSettings,
    type WorkspaceSnapshot,
} from "./model";

export const WORKSPACE_STORAGE_KEY = "resume-workspace:v1";
export const LEGACY_PROFILES_KEY = "profiles";
export const LEGACY_MIGRATION_MARKER = "resume-workspace:legacy-migrated";

export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem?(key: string): void;
}

export interface PersistedWorkspace {
    kind: "resume-workspace";
    version: typeof WORKSPACE_SCHEMA_VERSION;
    savedAt: string;
    snapshot: WorkspaceSnapshot;
}

export interface ExportedResumeDocument {
    kind: "resume-document";
    version: typeof WORKSPACE_SCHEMA_VERSION;
    exportedAt: string;
    document: ResumeDocument;
}

export interface PersistenceAdapter {
    read(): PersistedWorkspace | null | Promise<PersistedWorkspace | null>;
    write(value: PersistedWorkspace): void | Promise<void>;
}

export interface LocalStorageAdapterOptions {
    storage?: StorageLike | null;
    key?: string;
    legacyProfilesKey?: string;
    migrationMarkerKey?: string;
    idFactory?: IdFactory;
    now?: () => string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const parseJson = (value: string | null): unknown => {
    if (!value) return null;
    try {
        return JSON.parse(value) as unknown;
    } catch {
        return null;
    }
};

const getDefaultStorage = (): StorageLike | null => {
    // This adapter is the only place allowed to know about browser globals.
    // `typeof` keeps SSR and node test imports safe.
    if (typeof globalThis === "undefined") return null;
    try {
        const candidate = (globalThis as { localStorage?: StorageLike }).localStorage;
        return candidate ?? null;
    } catch {
        return null;
    }
};

const normaliseSnapshot = (
    value: unknown,
    options: NormalizationOptions = {}
): WorkspaceSnapshot | null => {
    if (!isRecord(value)) return null;
    if (!isRecord(value.documents)) return null;
    const documentsSource = value.documents;
    const documents = Object.create(null) as Record<string, ResumeDocument>;
    const sourceIds = new Map<string, string>();
    const idFactory = options.idFactory ?? defaultIdFactory;
    for (const [key, documentValue] of Object.entries(documentsSource)) {
        let document = normalizeResumeDocument(documentValue, options);
        let id = document.meta.id || key;
        while (Object.hasOwn(documents, id)) id = idFactory("document");
        if (id !== document.meta.id) {
            document = { ...document, meta: { ...document.meta, id } };
        }
        documents[id] = document;
        sourceIds.set(key, id);
    }
    const activeCandidate =
        typeof value.activeDocumentId === "string" ? value.activeDocumentId : null;
    const resolvedActiveId = activeCandidate
        ? sourceIds.get(activeCandidate) ?? activeCandidate
        : null;
    const activeDocumentId = resolvedActiveId && documents[resolvedActiveId]
        ? resolvedActiveId
        : Object.keys(documents)[0] ?? null;
    const settingsSource = isRecord(value.settings) ? value.settings : {};
    const settings: WorkspaceSettings = {
        autosave:
            typeof settingsSource.autosave === "boolean"
                ? settingsSource.autosave
                : true,
        autosaveDebounceMs:
            typeof settingsSource.autosaveDebounceMs === "number" &&
            Number.isFinite(settingsSource.autosaveDebounceMs)
                ? Math.max(0, settingsSource.autosaveDebounceMs)
                : 500,
    };
    const active = activeDocumentId ? documents[activeDocumentId] : null;
    const currentStep = active?.meta.step ?? "personal-info";
    return {
        documents,
        activeDocumentId,
        currentStep,
        settings,
    };
};

export const serializeWorkspace = (
    snapshot: WorkspaceSnapshot,
    now = new Date().toISOString()
): PersistedWorkspace => {
    const documents = Object.create(null) as Record<string, ResumeDocument>;
    for (const [id, document] of Object.entries(snapshot.documents)) {
        const cleaned = cleanResumeDocument(document);
        documents[cleaned.meta.id || id] = cleaned;
    }
    const activeDocumentId = snapshot.activeDocumentId && documents[snapshot.activeDocumentId]
        ? snapshot.activeDocumentId
        : Object.keys(documents)[0] ?? null;
    return {
        kind: "resume-workspace",
        version: WORKSPACE_SCHEMA_VERSION,
        savedAt: now,
        snapshot: {
            documents,
            activeDocumentId,
            currentStep: activeDocumentId
                ? documents[activeDocumentId]?.meta.step ?? "personal-info"
                : "personal-info",
            settings: {
                autosave: snapshot.settings.autosave,
                autosaveDebounceMs: snapshot.settings.autosaveDebounceMs,
            },
        },
    };
};

export const encodeWorkspace = (
    snapshot: WorkspaceSnapshot,
    now = new Date().toISOString()
): string => JSON.stringify(serializeWorkspace(snapshot, now));

export const serializeDocument = (
    document: ResumeDocument,
    now = new Date().toISOString()
): ExportedResumeDocument => ({
    kind: "resume-document",
    version: WORKSPACE_SCHEMA_VERSION,
    exportedAt: now,
    document: cleanResumeDocument(document),
});

export const encodeDocument = (
    document: ResumeDocument,
    now = new Date().toISOString()
): string => JSON.stringify(serializeDocument(document, now));

export const deserializeDocument = (
    value: unknown,
    options: NormalizationOptions = {}
): ResumeDocument | null => {
    const parsed = typeof value === "string" ? parseJson(value) : value;
    if (!isRecord(parsed)) return null;
    if (parsed.kind === "resume-document" && parsed.version === WORKSPACE_SCHEMA_VERSION) {
        return normalizeResumeDocument(parsed.document, {
            ...options,
            preserveEmptyEntries: true,
        });
    }
    // Permit importing a bare canonical/legacy profile as a convenience for
    // users who copied a profile object from the old Svelte app.
    if (parsed.meta || parsed.metadata || parsed.personalInfo || parsed.personal_info) {
        return normalizeResumeDocument(parsed, {
            ...options,
            preserveEmptyEntries: true,
        });
    }
    return null;
};

/** Decode a versioned envelope, accepting an older direct snapshot envelope. */
export const deserializeWorkspace = (
    value: unknown,
    options: NormalizationOptions = {}
): WorkspaceSnapshot | null => {
    const parsed = typeof value === "string" ? parseJson(value) : value;
    if (!isRecord(parsed)) return null;
    if (parsed.kind === "resume-workspace" && parsed.version === WORKSPACE_SCHEMA_VERSION) {
        return normaliseSnapshot(parsed.snapshot, options);
    }
    // Early development builds stored { version: 1, documents, ... } without a
    // nested snapshot.  Reading it costs little and avoids trapping users in a
    // blank editor after an upgrade.
    if (parsed.version === WORKSPACE_SCHEMA_VERSION && isRecord(parsed.documents)) {
        return normaliseSnapshot(parsed, options);
    }
    return null;
};

const legacyMeta = (value: unknown): Record<string, unknown> =>
    isRecord(value) ? value : {};

/** Migrate the Svelte `profiles` array plus one localStorage key per profile. */
export const migrateLegacyStorage = (
    storage: StorageLike,
    options: {
        profilesKey?: string;
        idFactory?: IdFactory;
        now?: () => string;
    } = {}
): PersistedWorkspace | null => {
    const profilesKey = options.profilesKey ?? LEGACY_PROFILES_KEY;
    const idFactory = options.idFactory ?? defaultIdFactory;
    const now = options.now ?? (() => new Date().toISOString());
    const parsedProfiles = parseJson(storage.getItem(profilesKey));
    const profiles = Array.isArray(parsedProfiles)
        ? parsedProfiles
        : typeof parsedProfiles === "string"
          ? (parseJson(parsedProfiles) as unknown)
          : [];
    if (!Array.isArray(profiles) || profiles.length === 0) return null;

    const documents: Record<string, ResumeDocument> = {};
    for (const metadataValue of profiles) {
        const metadata = legacyMeta(metadataValue);
        const id = typeof metadata.id === "string" ? metadata.id.trim() : "";
        if (!id) continue;
        const profile = parseJson(storage.getItem(id));
        const profileRecord = isRecord(profile) ? profile : {};
        const merged = {
            ...profileRecord,
            // Per-ID payloads are authoritative when they contain metadata;
            // dashboard metadata fills the fields older payloads omitted.
            meta: {
                ...metadata,
                ...(isRecord(profileRecord.meta) ? profileRecord.meta : {}),
            },
        };
        let document = normalizeResumeDocument(merged, {
            idFactory,
            now,
            preserveEmptyEntries: true,
        });
        let documentId = document.meta.id;
        while (Object.hasOwn(documents, documentId)) {
            documentId = idFactory("document");
        }
        if (documentId !== document.meta.id) {
            document = {
                ...document,
                meta: { ...document.meta, id: documentId },
            };
        }
        documents[documentId] = document;
    }
    if (Object.keys(documents).length === 0) return null;
    const activeDocumentId = Object.keys(documents)[0] ?? null;
    return serializeWorkspace(
        {
            ...createInitialWorkspaceSnapshot(),
            documents,
            activeDocumentId,
            currentStep: activeDocumentId
                ? documents[activeDocumentId].meta.step
                : "personal-info",
        },
        now()
    );
};

export const createLocalStoragePersistence = (
    options: LocalStorageAdapterOptions = {}
): PersistenceAdapter => {
    const storage = options.storage === undefined ? getDefaultStorage() : options.storage;
    const key = options.key ?? WORKSPACE_STORAGE_KEY;
    const profilesKey = options.legacyProfilesKey ?? LEGACY_PROFILES_KEY;
    const markerKey = options.migrationMarkerKey ?? LEGACY_MIGRATION_MARKER;
    const idFactory = options.idFactory ?? defaultIdFactory;
    const now = options.now ?? (() => new Date().toISOString());

    return {
        read() {
            if (!storage) return null;
            const current = deserializeWorkspace(parseJson(storage.getItem(key)), {
                idFactory,
                now,
                preserveEmptyEntries: true,
            });
            if (current) {
                return serializeWorkspace(current, now());
            }
            // Migration is deliberately one-time.  The marker is written even
            // when profiles is empty so a newly created empty app does not
            // repeatedly inspect a stale/invalid legacy key.
            if (storage.getItem(markerKey) !== "1") {
                const migrated = migrateLegacyStorage(storage, {
                    profilesKey,
                    idFactory,
                    now,
                });
                try {
                    if (migrated) storage.setItem(key, JSON.stringify(migrated));
                    storage.setItem(markerKey, "1");
                } catch {
                    // Private browsing/quota failures should not prevent the
                    // editor from opening; the store reports save failures.
                }
                return migrated;
            }
            return null;
        },
        write(value) {
            if (!storage) throw new Error("Local storage is unavailable");
            storage.setItem(key, JSON.stringify(value));
        },
    };
};

export const createVersionedLocalStoragePersistence = createLocalStoragePersistence;

/** Minimal adapter used by unit tests and by non-browser hosts. */
export const createMemoryPersistence = (
    initial: PersistedWorkspace | WorkspaceSnapshot | null = null
): PersistenceAdapter & { value: PersistedWorkspace | null } => {
    let value: PersistedWorkspace | null = null;
    if (initial) {
        value = isRecord(initial) && initial.kind === "resume-workspace"
            ? (initial as PersistedWorkspace)
            : serializeWorkspace(initial as WorkspaceSnapshot);
    }
    return {
        get value() {
            return value;
        },
        read: () => value,
        write: (next) => {
            value = next;
        },
    };
};
