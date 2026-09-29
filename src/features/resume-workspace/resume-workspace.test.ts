import { describe, expect, it } from "vitest";
import {
    BUILT_IN_SECTION_IDS,
    createEmptyResumeDocument,
    createInitialWorkspaceSnapshot,
    getCompletion,
    getNavigation,
    getPreviewRenderModel,
    normalizeResumeDocument,
    reduceWorkspace,
    type IdFactory,
} from "./model";
import {
    createLocalStoragePersistence,
    createMemoryPersistence,
    deserializeWorkspace,
    deserializeDocument,
    encodeDocument,
    migrateLegacyStorage,
    serializeWorkspace,
} from "./persistence";
import {
    createResumeWorkspaceStore,
    selectCompletion,
    selectDashboardSummaries,
    selectNavigation,
    selectPreviewRenderModel,
} from "./store";

const deterministicIds = (): IdFactory => {
    let next = 0;
    return (prefix) => `${prefix}-${++next}`;
};

const clock = () => "2026-01-01T00:00:00.000Z";

describe("resume workspace model", () => {
    it("normalizes legacy fields, sanitizes rich text, and gives repeatables stable IDs", () => {
        const document = normalizeResumeDocument(
            {
                meta: { id: "legacy", name: "  Ada  ", step: "personal-info" },
                personal_info: {
                    name: "Ada Lovelace",
                    title_links: [{ title: "Site", url: "https://example.com" }],
                },
                summary: "<p>Builder</p><script>alert(1)</script>",
                experience: [
                    {
                        company: "Analytical Engines",
                        title: "Engineer",
                        start_date: "1842",
                        description: "<p>Built <strong>things</strong></p>",
                    },
                ],
                certifications: ["Certificate"],
                awards: "<ul><li></li></ul>",
            },
            { idFactory: deterministicIds(), now: clock }
        );

        expect(document.meta.name).toBe("Ada");
        expect(document.personalInfo.titleLinks[0].id).toBe("link-1");
        expect(document.experience[0].id).toBe("experience-2");
        expect(document.certifications[0].id).toBe("certification-3");
        expect(document.summary).toBe("<p>Builder</p>");
        expect(document.awards).toBe("");
        expect(document.settings.accentColor).toBe("#004aad");
    });

    it("keeps safe portrait images, drops unsafe ones, and allows removal through patches", () => {
        const validImage = "data:image/png;base64,iVBORw0KGgo=";
        const document = normalizeResumeDocument(
            {
                personal_info: {
                    name: "Ada Lovelace",
                    image: validImage,
                },
            },
            { idFactory: deterministicIds(), now: clock }
        );
        expect(document.personalInfo.image).toBe(validImage);

        const rejected = normalizeResumeDocument(
            {
                personalInfo: {
                    image: "data:text/html;base64,PGI+",
                },
            },
            { idFactory: deterministicIds(), now: clock }
        );
        expect(rejected.personalInfo.image).toBeUndefined();

        let snapshot = createInitialWorkspaceSnapshot();
        snapshot = reduceWorkspace(snapshot, { type: "document/create", document: { id: "one" } }, { idFactory: deterministicIds(), now: clock });
        snapshot = reduceWorkspace(snapshot, { type: "document/update", patch: { personalInfo: { image: validImage } } }, { idFactory: deterministicIds(), now: clock });
        expect(snapshot.documents.one.personalInfo.image).toBe(validImage);
        snapshot = reduceWorkspace(snapshot, { type: "document/update", patch: { personalInfo: { image: undefined } } }, { idFactory: deterministicIds(), now: clock });
        expect(snapshot.documents.one.personalInfo.image).toBeUndefined();
    });

    it("keeps layout separate from content and derives ordered navigation/preview", () => {
        const document = createEmptyResumeDocument(
            { id: "doc", name: "Resume", sections: ["skills", "summary"] },
            { idFactory: deterministicIds(), now: clock }
        );
        expect(document.sections.map((section) => section.id)).toEqual([
            "skills",
            "summary",
        ]);
        expect(document.experience).toEqual([]);
        const navigation = getNavigation(document, "summary");
        expect(navigation.items.map((item) => item.id)).toEqual([
            "personal-info",
            "skills",
            "summary",
        ]);
        expect(navigation.previous?.id).toBe("skills");
        expect(navigation.next).toBeNull();
        expect(getPreviewRenderModel(document).sections.map((section) => section.id)).toEqual([
            "skills",
            "summary",
        ]);
    });

    it("supports reducer document and entry commands without mutating input", () => {
        const ids = deterministicIds();
        let snapshot = createInitialWorkspaceSnapshot();
        snapshot = reduceWorkspace(snapshot, { type: "document/create", document: { id: "one" } }, { idFactory: ids, now: clock });
        expect(snapshot.activeDocumentId).toBe("one");
        snapshot = reduceWorkspace(snapshot, {
            type: "entry/create",
            section: "experience",
            entry: { company: "Example" },
        }, { idFactory: ids, now: clock });
        const entryId = snapshot.documents.one.experience[0].id;
        snapshot = reduceWorkspace(snapshot, {
            type: "entry/update",
            section: "experience",
            entryId,
            patch: { title: "Engineer", description: "<script>x</script><p>Safe</p>" },
        }, { idFactory: ids, now: clock });
        expect(snapshot.documents.one.experience[0]).toMatchObject({
            id: entryId,
            company: "Example",
            title: "Engineer",
            description: "<p>Safe</p>",
        });
        snapshot = reduceWorkspace(snapshot, {
            type: "entry/duplicate",
            section: "experience",
            entryId,
        }, { idFactory: ids, now: clock });
        expect(snapshot.documents.one.experience).toHaveLength(2);
        expect(snapshot.documents.one.experience[0].id).not.toBe(
            snapshot.documents.one.experience[1].id
        );
        snapshot = reduceWorkspace(snapshot, {
            type: "section/add",
            sectionId: "certifications",
        }, { idFactory: ids, now: clock });
        expect(snapshot.documents.one.sections.map((section) => section.id)).toContain(
            "certifications"
        );
        snapshot = reduceWorkspace(snapshot, {
            type: "section/rename",
            sectionId: "certifications",
            title: "Credentials",
        }, { idFactory: ids, now: clock });
        expect(snapshot.documents.one.sections.find((section) => section.id === "certifications")?.title).toBe("Credentials");
    });

    it("preserves in-progress whitespace in controlled editor fields", () => {
        const ids = deterministicIds();
        const dependencies = { idFactory: ids, now: clock };
        let snapshot = reduceWorkspace(
            createInitialWorkspaceSnapshot(),
            { type: "document/create", document: { id: "one" } },
            dependencies
        );
        snapshot = reduceWorkspace(
            snapshot,
            {
                type: "document/update",
                patch: { personalInfo: { name: "Ada " } },
            },
            dependencies
        );
        snapshot = reduceWorkspace(
            snapshot,
            { type: "entry/create", section: "skills" },
            dependencies
        );
        const skillId = snapshot.documents.one.skills[0].id;
        snapshot = reduceWorkspace(
            snapshot,
            {
                type: "entry/update",
                section: "skills",
                entryId: skillId,
                patch: { name: "Systems ", category: "Design " },
            },
            dependencies
        );
        snapshot = reduceWorkspace(
            snapshot,
            { type: "personal-link/create" },
            dependencies
        );
        const linkId = snapshot.documents.one.personalInfo.titleLinks[0].id;
        snapshot = reduceWorkspace(
            snapshot,
            {
                type: "personal-link/update",
                linkId,
                patch: { title: "Portfolio ", url: "https://example.com/path " },
            },
            dependencies
        );

        expect(snapshot.documents.one.personalInfo.name).toBe("Ada ");
        expect(snapshot.documents.one.skills[0]).toMatchObject({
            name: "Systems ",
            category: "Design ",
        });
        expect(snapshot.documents.one.personalInfo.titleLinks[0]).toMatchObject({
            title: "Portfolio ",
            url: "https://example.com/path ",
        });
    });

    it("rejects invalid accent colors at the state boundary", () => {
        const dependencies = { idFactory: deterministicIds(), now: clock };
        let snapshot = reduceWorkspace(
            createInitialWorkspaceSnapshot(),
            { type: "document/create", document: { id: "one" } },
            dependencies
        );
        snapshot = reduceWorkspace(
            snapshot,
            {
                type: "document/settings/update",
                patch: { accentColor: "not-a-color" },
            },
            dependencies
        );
        expect(snapshot.documents.one.settings.accentColor).toBe("#004aad");
    });

    it("keeps the current step inside the visible configured workflow", () => {
        const ids = deterministicIds();
        let snapshot = createInitialWorkspaceSnapshot();
        snapshot = reduceWorkspace(
            snapshot,
            {
                type: "document/create",
                document: { id: "one", sections: ["summary"] },
            },
            { idFactory: ids, now: clock }
        );
        snapshot = reduceWorkspace(
            snapshot,
            { type: "step/set", step: "experience" },
            { idFactory: ids, now: clock }
        );
        expect(snapshot.currentStep).toBe("personal-info");
        snapshot = reduceWorkspace(
            snapshot,
            { type: "step/set", step: "summary" },
            { idFactory: ids, now: clock }
        );
        snapshot = reduceWorkspace(
            snapshot,
            { type: "section/remove", sectionId: "summary" },
            { idFactory: ids, now: clock }
        );
        expect(snapshot.currentStep).toBe("personal-info");
        expect(snapshot.documents.one.meta.step).toBe("personal-info");
    });
});

describe("resume workspace persistence", () => {
    it("round-trips a versioned document export", () => {
        const document = createEmptyResumeDocument(
            { id: "doc", name: "Export me" },
            { idFactory: deterministicIds(), now: clock }
        );
        const encoded = encodeDocument(document, clock());
        const decoded = deserializeDocument(encoded, {
            idFactory: deterministicIds(),
            now: clock,
        });
        expect(decoded?.meta.id).toBe("doc");
        expect(decoded?.settings.template).toBe("tenali");
    });

    it("migrates the Svelte profiles metadata plus per-id payload once", () => {
        const values = new Map<string, string>([
            [
                "profiles",
                JSON.stringify([
                    {
                        id: "legacy-id",
                        name: "Legacy resume",
                        created: "2025-01-01T00:00:00.000Z",
                        last_updated: "2025-02-01T00:00:00.000Z",
                        step: "skills",
                    },
                ]),
            ],
            [
                "legacy-id",
                JSON.stringify({
                    personal_info: { name: "Grace Hopper" },
                    skills: [{ name: "COBOL", category: "Languages" }],
                }),
            ],
        ]);
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        };
        const migrated = migrateLegacyStorage(storage, {
            idFactory: deterministicIds(),
            now: clock,
        });
        expect(migrated?.snapshot.activeDocumentId).toBe("legacy-id");
        expect(migrated?.snapshot.documents["legacy-id"].personalInfo.name).toBe("Grace Hopper");
        const adapter = createLocalStoragePersistence({
            storage,
            idFactory: deterministicIds(),
            now: clock,
        });
        expect(adapter.read()).not.toBeNull();
        expect(values.get("resume-workspace:legacy-migrated")).toBe("1");
        expect(values.get("resume-workspace:v1")).toContain("resume-workspace");
    });

    it("does not mark legacy migration complete when the workspace write fails", () => {
        const values = new Map<string, string>([
            ["profiles", JSON.stringify([{ id: "legacy-id", name: "Legacy" }])],
            ["legacy-id", JSON.stringify({ personal_info: { name: "Grace" } })],
        ]);
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => {
                if (key === "resume-workspace:v1") throw new Error("quota");
                values.set(key, value);
            },
        };
        const adapter = createLocalStoragePersistence({
            storage,
            idFactory: deterministicIds(),
            now: clock,
        });
        expect(adapter.read()).not.toBeNull();
        expect(values.get("resume-workspace:legacy-migrated")).toBeUndefined();
    });

    it("rejects malformed envelopes and preserves colliding document IDs", () => {
        expect(
            deserializeWorkspace({
                kind: "resume-workspace",
                version: 1,
                snapshot: {},
            })
        ).toBeNull();

        const duplicate = {
            meta: { id: "duplicate", name: "Resume" },
            personalInfo: {},
        };
        const decoded = deserializeWorkspace(
            {
                kind: "resume-workspace",
                version: 1,
                snapshot: {
                    documents: { first: duplicate, second: duplicate },
                    activeDocumentId: "second",
                    settings: {},
                },
            },
            { idFactory: deterministicIds(), now: clock }
        );
        expect(Object.keys(decoded?.documents ?? {})).toHaveLength(2);
        expect(new Set(Object.keys(decoded?.documents ?? {})).size).toBe(2);
        expect(decoded?.activeDocumentId).not.toBe("duplicate");
    });
});

describe("resume workspace store", () => {
    it("offers one canonical document, undo/redo, and debounced persistence", async () => {
        const persistence = createMemoryPersistence();
        const store = createResumeWorkspaceStore({
            persistence,
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
            autosaveDebounceMs: 0,
        });
        const actions = store.getState().actions;
        const id = actions.createDocument({ id: "one", name: "First" });
        actions.updateDocument({ personalInfo: { name: "First Person" } });
        expect(store.getState().documents[id].personalInfo.name).toBe("First Person");
        actions.undo();
        expect(store.getState().documents[id].personalInfo.name).toBe("");
        actions.redo();
        expect(store.getState().documents[id].personalInfo.name).toBe("First Person");
        await actions.flushSave();
        expect(persistence.value?.snapshot.documents.one.personalInfo.name).toBe(
            "First Person"
        );
    });

    it("imports a workspace and derives dashboard completion", () => {
        const source = createResumeWorkspaceStore({
            persistence: null,
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
        });
        source.getState().actions.createDocument({ id: "source", name: "Source" });
        const payload = source.getState().actions.exportWorkspace();
        const target = createResumeWorkspaceStore({
            persistence: null,
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
        });
        expect(target.getState().actions.importWorkspace(payload)).toBe(true);
        expect(Object.keys(target.getState().documents)).toEqual(["source"]);
        expect(getCompletion(target.getState().documents.source).percent).toBe(0);
        expect(BUILT_IN_SECTION_IDS).toHaveLength(8);
    });

    it("merges edits made while an asynchronous hydration is pending", async () => {
        const persistedDocument = createEmptyResumeDocument(
            { id: "persisted", name: "Persisted" },
            { idFactory: deterministicIds(), now: clock }
        );
        const persisted = serializeWorkspace({
            ...createInitialWorkspaceSnapshot(),
            documents: { persisted: persistedDocument },
            activeDocumentId: "persisted",
        });
        let resolveRead: ((value: typeof persisted) => void) | undefined;
        const read = new Promise<typeof persisted>((resolve) => {
            resolveRead = resolve;
        });
        const store = createResumeWorkspaceStore({
            persistence: { read: () => read, write: () => undefined },
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
            autosaveDebounceMs: 0,
        });
        const hydration = store.getState().actions.hydrate();
        store.getState().actions.createDocument({ id: "new", name: "New" });
        resolveRead?.(persisted);
        await hydration;
        expect(Object.keys(store.getState().documents).sort()).toEqual([
            "new",
            "persisted",
        ]);
        expect(store.getState().activeDocumentId).toBe("new");
    });

    it("keeps derived selector references stable for unchanged state", () => {
        const store = createResumeWorkspaceStore({
            persistence: null,
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
        });
        store.getState().actions.createDocument({ id: "one" });
        const state = store.getState();
        expect(selectCompletion(state)).toBe(selectCompletion(state));
        expect(selectNavigation(state)).toBe(selectNavigation(state));
        expect(selectDashboardSummaries(state)).toBe(
            selectDashboardSummaries(state)
        );
        expect(selectPreviewRenderModel(state)).toBe(
            selectPreviewRenderModel(state)
        );
    });

    it("rejects malformed workspace imports without deleting current documents", () => {
        const store = createResumeWorkspaceStore({
            persistence: null,
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
        });
        store.getState().actions.createDocument({ id: "safe" });
        expect(
            store.getState().actions.importWorkspace({
                kind: "resume-workspace",
                version: 1,
                snapshot: {},
            })
        ).toBe(false);
        expect(store.getState().documents.safe).toBeDefined();
    });
});

describe("document-targeted commands and history", () => {
    const createStore = () =>
        createResumeWorkspaceStore({
            persistence: null,
            idFactory: deterministicIds(),
            now: clock,
            autoHydrate: false,
        });

    it("edits an explicit document without touching the active one", () => {
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "background" });
        actions.createDocument({ id: "open", sections: ["summary", "skills"] });
        expect(store.getState().activeDocumentId).toBe("open");

        const entryId = actions.createEntry("skills", { name: "Go" }, "background");
        actions.renameSection("experience", "Work history", "background");
        actions.setSectionVisibility("skills", false, "background");
        actions.updateDocumentSettings({ template: "oslo" }, "background");
        const linkId = actions.createLink({ title: "Site", url: "https://example.com" }, "background");

        const state = store.getState();
        expect(state.activeDocumentId).toBe("open");
        expect(state.documents.background.skills.map((skill) => skill.id)).toEqual([entryId]);
        expect(state.documents.background.sections.find((section) => section.id === "experience")?.title).toBe("Work history");
        expect(state.documents.background.settings.template).toBe("oslo");
        expect(state.documents.background.personalInfo.titleLinks.map((link) => link.id)).toEqual([linkId]);
        expect(state.documents.open.skills).toEqual([]);
        expect(state.documents.open.settings.template).toBe("tenali");
    });

    it("keeps the open editor's step when a background document hides that section", () => {
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "background", sections: ["skills"] });
        actions.createDocument({ id: "open", sections: ["skills"] });
        actions.setCurrentStep("skills");
        actions.setSectionVisibility("skills", false, "background");
        expect(store.getState().currentStep).toBe("skills");
        actions.setSectionVisibility("skills", false);
        expect(store.getState().currentStep).toBe("personal-info");
    });

    it("moves named sections to the front and keeps the rest in order", () => {
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "one", sections: ["summary", "experience", "education", "skills"] });
        actions.setSectionOrder(["skills", "experience", "skills"]);
        expect(store.getState().documents.one.sections.map((section) => section.id)).toEqual([
            "skills",
            "experience",
            "summary",
            "education",
        ]);
    });

    it("treats step changes as navigation rather than undoable edits", () => {
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "one", sections: ["summary"] });
        const pastBefore = store.getState().history.past.length;
        const updatedAt = store.getState().documents.one.meta.updatedAt;
        actions.setCurrentStep("summary");
        expect(store.getState().currentStep).toBe("summary");
        expect(store.getState().documents.one.meta.step).toBe("summary");
        expect(store.getState().history.past.length).toBe(pastBefore);
        expect(store.getState().documents.one.meta.updatedAt).toBe(updatedAt);
    });

    it("records a batch as a single undo entry", () => {
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "one" });
        const pastBefore = store.getState().history.past.length;
        const ids = actions.batch(() => [
            actions.createEntry("skills", { name: "Go" }),
            actions.createEntry("skills", { name: "Rust" }),
            actions.batch(() => actions.createEntry("skills", { name: "Zig" })),
        ]);
        expect(ids.every(Boolean)).toBe(true);
        expect(store.getState().history.past.length).toBe(pastBefore + 1);
        actions.undo();
        expect(store.getState().documents.one.skills).toEqual([]);
        actions.redo();
        expect(store.getState().documents.one.skills.map((skill) => skill.name)).toEqual(["Go", "Rust", "Zig"]);
    });
});
