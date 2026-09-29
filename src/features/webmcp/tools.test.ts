import { beforeEach, describe, expect, it } from "vitest";
import { createResumeWorkspaceStore } from "@/features/resume-workspace/store";

import { createResumeTools } from "./tools";

/**
 * Executes a tool by name against the shared fixture host, parsing the JSON
 * payload the way an agent would.
 */
const run = async (name: string, input: Record<string, unknown> = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`missing tool: ${name}`);
    const result = await tool.execute(input, { signal: new AbortController().signal });
    const text = result.content[0]?.text ?? "";
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
};

/**
 * Runs a tool expecting an input failure.  Tools must return readable error
 * results (never throw), because the native WebMCP implementation discards
 * thrown error messages.
 */
const runError = async (name: string, input: Record<string, unknown> = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`missing tool: ${name}`);
    const result = await tool.execute(input, { signal: new AbortController().signal });
    expect(result.isError).toBe(true);
    const text = result.content[0]?.text ?? "";
    expect(text.startsWith("Error: ")).toBe(true);
    return text;
};

let path = "/";
let search: Record<string, string> = {};
const navigations: Array<{ to: string; params?: Record<string, string>; search?: Record<string, string> }> = [];
const printCalls: number[] = [];
const store = createResumeWorkspaceStore({ persistence: null, autoHydrate: false });
const tools = createResumeTools({
    store,
    async navigate(to, params, nextSearch) {
        navigations.push({ to, params, ...(nextSearch && Object.keys(nextSearch).length ? { search: nextSearch } : {}) });
        path = to === "/" ? "/" : to.replace("$documentId", params?.documentId ?? "");
        search = nextSearch ?? {};
    },
    getPath: () => path,
    getSearch: () => search,
    printDocument: async () => {
        printCalls.push(Date.now());
    },
});

beforeEach(() => {
    navigations.length = 0;
    printCalls.length = 0;
    path = "/";
    search = {};
    // Reset workspace state between tests without persistence.
    store.setState({
        ...store.getState(),
        documents: {},
        activeDocumentId: null,
        currentStep: "personal-info",
        history: { past: [], future: [] },
    });
});

describe("resume webmcp tools", () => {
    it("exposes the full tool set", () => {
        expect(tools.map((tool) => tool.name)).toEqual([
            "get-workspace",
            "get-resume",
            "create-resume",
            "create-sample-resume",
            "import-resume",
            "duplicate-resume",
            "update-resume-details",
            "delete-resume",
            "set-builder-step",
            "open-editor-panel",
            "open-preview",
            "go-to-dashboard",
            "undo",
            "redo",
            "update-personal-info",
            "update-summary",
            "update-awards",
            "add-section-entry",
            "update-section-entry",
            "delete-section-entry",
            "move-section-entry",
            "duplicate-section-entry",
            "add-link",
            "update-link",
            "delete-link",
            "move-link",
            "set-section-visibility",
            "rename-section",
            "reorder-sections",
            "remove-section",
            "list-templates",
            "recommend-templates",
            "open-template-explorer",
            "set-appearance",
            "export-pdf",
            "export-resume",
            "get-live-session",
        ]);
        for (const tool of tools) {
            expect(tool.title?.length).toBeGreaterThan(2);
            expect(tool.description.length).toBeGreaterThan(20);
            expect(tool.inputSchema).toMatchObject({ type: "object" });
        }
        const readOnly = tools.filter((tool) => tool.annotations?.readOnlyHint).map((tool) => tool.name);
        expect(readOnly).toEqual(["get-workspace", "get-resume", "open-preview", "go-to-dashboard", "list-templates", "recommend-templates", "export-resume", "get-live-session"]);
    });

    it("reports an empty workspace before any resume exists", async () => {
        const workspace = (await run("get-workspace")) as { resumes: unknown[] };
        expect(workspace.resumes).toEqual([]);
    });

    it("fails clearly when there is no active resume", async () => {
        expect(await runError("get-resume")).toMatch(/no active resume/i);
        expect(await runError("get-resume", { resumeId: "nope" })).toMatch(
            /no resume found with id "nope"/i
        );
    });

    it("creates a resume, selects it, and navigates to the editor", async () => {
        const created = (await run("create-resume", {
            name: "Test Resume",
            template: "oslo",
        })) as { resumeId: string; currentStep: string };
        expect(created.resumeId).toBeTruthy();
        expect(created.currentStep).toBe("personal-info");
        expect(navigations).toEqual([
            { to: "/resume/$documentId", params: { documentId: created.resumeId } },
        ]);
        const state = store.getState();
        expect(state.activeDocumentId).toBe(created.resumeId);
        expect(state.documents[created.resumeId]?.settings.template).toBe("oslo");
    });

    it("rejects unknown templates and page sizes", async () => {
        await expect(
            runError("create-resume", { template: "banana" })
        ).resolves.toMatch(/available templates/i);
        await expect(
            runError("create-resume", { pageSize: "A3" })
        ).resolves.toMatch(/pageSize.*A4, Letter/i);
    });

    it("fills a complete resume end to end", async () => {
        const { resumeId } = (await run("create-resume", {
            name: "Vyshnav - Java Backend Developer",
        })) as { resumeId: string };

        const personal = (await run("update-personal-info", {
            name: "Vyshnav",
            email: "vyshnav@example.com",
            phone: "+91 90000 00000",
            links: [
                { title: "LinkedIn", url: "https://linkedin.com/in/vyshnav" },
                { title: "GitHub", url: "https://github.com/vyshnav" },
            ],
        })) as { personalInfo: { titleLinks: Array<{ title: string }> } };
        expect(personal.personalInfo.titleLinks).toHaveLength(2);

        await run("update-summary", {
            summary: "<p>Java backend developer with 2 years at TCS.</p>",
        });

        const experience = (await run("add-section-entry", {
            section: "experience",
            entry: {
                company: "TCS",
                title: "Java Backend Developer",
                location: "Hyderabad, India",
                startDate: "Sep 2024",
                endDate: "Present",
                description: "<ul><li>Built Spring Boot services.</li></ul>",
            },
        })) as { entryId: string; entry: { company: string; description: string } };
        expect(experience.entryId).toMatch(/^experience-/);
        expect(experience.entry.company).toBe("TCS");
        expect(experience.entry.description).toContain("<li>");

        const skills = (await run("add-section-entry", {
            section: "skills",
            entry: { name: "Java", category: "Languages" },
        })) as { entryId: string };
        expect(skills.entryId).toMatch(/^skill-/);

        const project = (await run("add-section-entry", {
            section: "projects",
            entry: {
                title: "Payments platform",
                skills: ["Spring Boot", "Kafka"],
                links: [{ title: "Repo", url: "https://github.com/vyshnav/payments" }],
            },
        })) as { entry: { skills: string[]; links: Array<{ url: string }> } };
        expect(project.entry.skills).toEqual(["Spring Boot", "Kafka"]);
        expect(project.entry.links[0]?.url).toBe("https://github.com/vyshnav/payments");

        const language = (await run("add-section-entry", {
            section: "languages",
            entry: { name: "English", proficiency: "Fluent" },
        })) as { entry: { proficiency: string } };
        expect(language.entry.proficiency).toBe("Fluent");

        const updated = (await run("update-section-entry", {
            section: "skills",
            entryId: skills.entryId,
            patch: { category: "Programming languages" },
        })) as { entry: { category: string } };
        expect(updated.entry.category).toBe("Programming languages");

        const completion = (await run("get-resume", { resumeId })) as {
            completion: { percent: number };
            resume: { summary: string; experience: unknown[] };
        };
        expect(completion.resume.summary).toContain("Java backend developer");
        expect(completion.resume.experience).toHaveLength(1);
        expect(completion.completion.percent).toBeGreaterThan(0);
    });

    it("validates section entries with actionable errors", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        await expect(
            runError("add-section-entry", { section: "hobbies", entry: {} })
        ).resolves.toMatch(/"section" must be one of/i);
        await expect(
            runError("add-section-entry", { section: "experience", entry: {} })
        ).resolves.toMatch(/required: company, title/i);
        await expect(
            runError("add-section-entry", {
                section: "skills",
                entry: { name: "Java", level: "expert" },
            })
        ).resolves.toMatch(/unknown field.*"level"/i);
        await expect(
            runError("add-section-entry", {
                section: "languages",
                entry: { name: "Telugu", proficiency: "Native" },
            })
        ).resolves.toMatch(/"proficiency" must be one of/i);
        await expect(
            runError("add-section-entry", {
                section: "projects",
                entry: { title: "X", links: [{ title: "No url" }] },
            })
        ).resolves.toMatch(/requires a "url"/i);
        expect(resumeId).toBeTruthy();
    });

    it("updates and deletes entries by id", async () => {
        await run("create-resume", { name: "Edit me" });
        const skill = (await run("add-section-entry", {
            section: "skills",
            entry: { name: "SQL" },
        })) as { entryId: string };
        await run("update-section-entry", {
            section: "skills",
            entryId: skill.entryId,
            patch: { name: "PostgreSQL" },
        });
        const afterUpdate = store.getState().actions.exportDocument() ?? "";
        expect(afterUpdate).toContain("PostgreSQL");
        const deleted = (await run("delete-section-entry", {
            section: "skills",
            entryId: skill.entryId,
        })) as { remainingEntries: number };
        expect(deleted.remainingEntries).toBe(0);
    });

    it("lists existing entry ids when an entryId does not exist", async () => {
        await run("create-resume", {});
        const skill = (await run("add-section-entry", {
            section: "skills",
            entry: { name: "SQL" },
        })) as { entryId: string };
        const message = await runError("update-section-entry", {
            section: "skills",
            entryId: "skill-missing",
            patch: { name: "X" },
        });
        expect(message).toMatch(/existing skills entry ids: /i);
        expect(message).toContain(skill.entryId);
    });

    it("toggles section visibility and re-adds removed sections", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        await run("set-section-visibility", {
            section: "awards",
            enabled: false,
        });
        // awards is not part of the default sections; disabling is a no-op.
        const enabled = (await run("set-section-visibility", {
            section: "awards",
            enabled: true,
        })) as { sections: Array<{ id: string; visible: boolean }> };
        expect(
            enabled.sections.find((section) => section.id === "awards")?.visible
        ).toBe(true);

        // Hidden sections cannot be stepped into.
        await run("set-section-visibility", { section: "projects", enabled: false });
        await expect(
            runError("set-builder-step", { section: undefined, step: "projects" })
        ).resolves.toMatch(/exists but is hidden/i);

        const restored = (await run("set-section-visibility", {
            section: "projects",
            enabled: true,
        })) as { sections: Array<{ id: string; visible: boolean }> };
        expect(restored.sections.find((section) => section.id === "projects")?.visible).toBe(true);
        const restoredStep = (await run("set-builder-step", { step: "projects" })) as { stepTitle: string };
        expect(restoredStep.stepTitle).toBe("Projects");

        // ...but personal-info always works, and navigates to the editor.
        const step = (await run("set-builder-step", {
            resumeId,
            step: "personal-info",
        })) as { stepTitle: string };
        expect(step.stepTitle).toBe("Personal Info");
        expect(navigations.some(({ to }) => to === "/resume/$documentId")).toBe(true);
    });

    it("opens the editor when choosing a builder step from the preview", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        await run("open-preview", { resumeId });
        await run("set-builder-step", { resumeId, step: "experience" });
        expect(path).toBe(`/resume/${resumeId}`);
        expect(store.getState().currentStep).toBe("experience");
    });

    it("changes appearance settings and rejects invalid colors", async () => {
        await run("create-resume", {});
        const settings = (await run("set-appearance", {
            template: "zurich",
            pageSize: "Letter",
            accentColor: "#123456",
        })) as { settings: { template: string; pageSize: string; accentColor: string } };
        expect(settings.settings).toMatchObject({
            template: "zurich",
            pageSize: "Letter",
            accentColor: "#123456",
        });
        const restyled = (await run("set-appearance", { template: "boston" })) as {
            settings: { template: string; accentColor: string; titleFont: string; bodyFont: string };
        };
        expect(restyled.settings).toMatchObject({
            template: "boston",
            accentColor: "#1f2a44",
            titleFont: "Template default",
            bodyFont: "Template default",
        });
        await run("set-appearance", { accentColor: "#654321", titleFont: "Georgia" });
        const kept = (await run("set-appearance", { template: "oslo", keepCurrentStyle: true })) as {
            settings: { template: string; accentColor: string; titleFont: string };
        };
        expect(kept.settings).toMatchObject({ template: "oslo", accentColor: "#654321", titleFont: "Georgia" });
        await expect(
            runError("set-appearance", { accentColor: "teal" })
        ).resolves.toMatch(/hex color/i);
    });

    it("validates personal info input", async () => {
        await run("create-resume", {});
        await expect(
            runError("update-personal-info", { email: "not-an-email" })
        ).resolves.toMatch(/must look like name@example.com/i);
        await expect(
            runError("update-personal-info", {})
        ).resolves.toMatch(/provide at least one/i);
        await expect(
            runError("update-personal-info", { links: "linkedin.com" })
        ).resolves.toMatch(/"links" must be an array/i);
    });

    it("exports a resume as the portable JSON document", async () => {
        const { resumeId } = (await run("create-resume", {
            name: "Export target",
        })) as { resumeId: string };
        await run("update-personal-info", { name: "Vyshnav" });
        const exported = (await run("export-resume", { resumeId })) as {
            kind: string;
            document: { meta: { id: string }; personalInfo: { name: string } };
        };
        expect(exported.kind).toBe("resume-document");
        expect(exported.document.meta.id).toBe(resumeId);
        expect(exported.document.personalInfo.name).toBe("Vyshnav");
    });

    it("deletes a resume and returns to the dashboard when it was open", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const deleted = (await run("delete-resume", { resumeId })) as {
            deletedResumeId: string;
            remainingResumes: number;
        };
        expect(deleted).toEqual({ deletedResumeId: resumeId, remainingResumes: 0 });
        expect(navigations.at(-1)?.to).toBe("/");
        expect(store.getState().activeDocumentId).toBeNull();
    });

    it("navigates to preview and dashboard", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        await run("open-preview", { resumeId });
        expect(navigations.at(-1)).toEqual({
            to: "/resume/$documentId/preview",
            params: { documentId: resumeId },
        });
        await run("go-to-dashboard");
        expect(navigations.at(-1)?.to).toBe("/");
    });

    it("exports a PDF by opening the preview and starting the print flow", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const result = (await run("export-pdf", { resumeId })) as {
            previewPath: string;
            status: string;
            userStep: string;
        };
        expect(result.previewPath).toBe(`/resume/${resumeId}/preview`);
        expect(result.status).toBe("print-flow-started");
        expect(result.userStep).toMatch(/save as pdf/i);
        expect(printCalls).toHaveLength(1);
        expect(navigations.at(-1)).toEqual({
            to: "/resume/$documentId/preview",
            params: { documentId: resumeId },
        });
    });

    it("creates sample, imported, and duplicated resumes and opens them", async () => {
        const sample = (await run("create-sample-resume")) as { resumeId: string; name: string };
        expect(sample.name).toMatch(/maya patel/i);
        expect(path).toBe(`/resume/${sample.resumeId}`);

        const imported = (await run("import-resume", {
            resume: {
                name: "Imported role",
                summary: "<p>Hello</p>",
                experience: [{ company: "Acme", title: "Engineer" }],
                skills: [{ name: "Go" }, { name: "SQL" }],
                sections: ["summary", "experience", "skills"],
            },
        })) as { resumeId: string; name: string; sections: Array<{ id: string }> };
        expect(imported.name).toBe("Imported role");
        expect(imported.sections.map((section) => section.id)).toEqual(["summary", "experience", "skills"]);
        expect(store.getState().activeDocumentId).toBe(imported.resumeId);
        expect(store.getState().documents[imported.resumeId]?.skills).toHaveLength(2);

        const fromJson = (await run("import-resume", {
            json: JSON.stringify({ personalInfo: { name: "Json Person" } }),
        })) as { resumeId: string };
        expect(store.getState().documents[fromJson.resumeId]?.personalInfo.name).toBe("Json Person");
        await expect(runError("import-resume", { json: "{nope" })).resolves.toMatch(/not valid json/i);
        await expect(runError("import-resume", {})).resolves.toMatch(/provide the resume document/i);

        const copy = (await run("duplicate-resume", {
            resumeId: imported.resumeId,
            name: "Tailored copy",
        })) as { resumeId: string; sourceResumeId: string; name: string };
        expect(copy.sourceResumeId).toBe(imported.resumeId);
        expect(copy.name).toBe("Tailored copy");
        expect(store.getState().documents[copy.resumeId]?.experience[0]?.company).toBe("Acme");
        expect(path).toBe(`/resume/${copy.resumeId}`);
    });

    it("renames a resume and validates details", async () => {
        const { resumeId } = (await run("create-resume", { name: "Draft" })) as { resumeId: string };
        const renamed = (await run("update-resume-details", {
            name: "Staff Engineer, Acme",
            description: "For the Acme application",
        })) as { name: string; description: string };
        expect(renamed).toMatchObject({ name: "Staff Engineer, Acme", description: "For the Acme application" });
        expect(store.getState().documents[resumeId]?.meta.name).toBe("Staff Engineer, Acme");
        await expect(runError("update-resume-details", {})).resolves.toMatch(/at least one of: name, description/i);
    });

    it("opens editor panels through the URL and reports them", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const opened = (await run("open-editor-panel", { panel: "appearance" })) as { editPath: string };
        expect(opened.editPath).toBe(`/resume/${resumeId}?panel=appearance`);
        expect(search).toEqual({ panel: "appearance" });
        const workspace = (await run("get-workspace")) as { location: string; editorPanel: string };
        expect(workspace).toMatchObject({ location: "editor", editorPanel: "appearance" });
        await run("set-builder-step", { step: "experience" });
        expect(search).toEqual({});
        expect(store.getState().currentStep).toBe("experience");
        await expect(runError("open-editor-panel", { panel: "styles" })).resolves.toMatch(/content, sections, appearance/);
    });

    it("undoes and redoes agent changes, one batch at a time", async () => {
        await run("create-resume", {});
        await run("add-section-entry", {
            section: "skills",
            entries: [{ name: "Go" }, { name: "Rust" }, { name: "SQL", category: "Data" }],
        });
        const resumeId = store.getState().activeDocumentId ?? "";
        expect(store.getState().documents[resumeId]?.skills).toHaveLength(3);
        const undone = (await run("undo")) as { canRedo: boolean };
        expect(undone.canRedo).toBe(true);
        expect(store.getState().documents[resumeId]?.skills).toHaveLength(0);
        await run("redo");
        expect(store.getState().documents[resumeId]?.skills.map((skill) => skill.name)).toEqual(["Go", "Rust", "SQL"]);
        await expect(runError("redo")).resolves.toMatch(/nothing to redo/i);
    });

    it("sets and removes the photo with validation", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const withPhoto = (await run("update-personal-info", {
            image: "https://example.com/me.jpg",
        })) as { personalInfo: { hasImage: boolean } };
        expect(withPhoto.personalInfo.hasImage).toBe(true);
        await expect(runError("update-personal-info", { image: "javascript:alert(1)" })).resolves.toMatch(/"image" must be/);
        await run("update-personal-info", { image: "" });
        expect(store.getState().documents[resumeId]?.personalInfo.image).toBeUndefined();
    });

    it("adds entries in batches, at positions, and shows their section", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const first = (await run("add-section-entry", {
            section: "certifications",
            entry: { name: "AWS Developer", url: "aws.amazon.com/cert" },
        })) as { entryId: string; sectionVisibility: string; warnings: string[] };
        expect(first.sectionVisibility).toBe("added");
        expect(first.warnings[0]).toMatch(/plain text/);
        const batch = (await run("add-section-entry", {
            section: "certifications",
            entries: [{ name: "CKA" }, { name: "CKAD" }],
            position: 0,
        })) as { entryIds: string[] };
        expect(batch.entryIds).toHaveLength(2);
        expect(store.getState().documents[resumeId]?.certifications.map((entry) => entry.name)).toEqual([
            "CKA",
            "CKAD",
            "AWS Developer",
        ]);
        await expect(
            runError("add-section-entry", { section: "skills", entries: [{ name: "Go" }, { category: "x" }] })
        ).resolves.toMatch(/entries\[1\]: A skills entry requires "name"/);
        expect(store.getState().documents[resumeId]?.skills).toHaveLength(0);
    });

    it("moves and duplicates entries", async () => {
        await run("create-resume", {});
        const { entryIds } = (await run("add-section-entry", {
            section: "experience",
            entries: [
                { company: "A", title: "One" },
                { company: "B", title: "Two" },
                { company: "C", title: "Three" },
            ],
        })) as { entryIds: string[] };
        const moved = (await run("move-section-entry", {
            section: "experience",
            entryId: entryIds[2],
            direction: "top",
        })) as { order: string[] };
        expect(moved.order).toEqual([entryIds[2], entryIds[0], entryIds[1]]);
        const byIndex = (await run("move-section-entry", {
            section: "experience",
            entryId: entryIds[2],
            toIndex: 2,
        })) as { order: string[] };
        expect(byIndex.order).toEqual([entryIds[0], entryIds[1], entryIds[2]]);
        await expect(
            runError("move-section-entry", { section: "experience", entryId: entryIds[0], toIndex: 9 })
        ).resolves.toMatch(/from 0 to 2/);
        await expect(
            runError("move-section-entry", { section: "experience", entryId: entryIds[0] })
        ).resolves.toMatch(/exactly one of "toIndex"/);

        const copy = (await run("duplicate-section-entry", {
            section: "experience",
            entryId: entryIds[0],
        })) as { entryId: string; entry: { company: string } };
        expect(copy.entryId).not.toBe(entryIds[0]);
        expect(copy.entry.company).toBe("A");
        const resumeId = store.getState().activeDocumentId ?? "";
        expect(store.getState().documents[resumeId]?.experience.map((entry) => entry.id)).toEqual([
            entryIds[0],
            copy.entryId,
            entryIds[1],
            entryIds[2],
        ]);
    });

    it("manages headline and project links individually", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const github = (await run("add-link", { title: "GitHub", url: "https://github.com/me" })) as { linkId: string };
        const site = (await run("add-link", { title: "Site", url: "https://me.dev", position: 0 })) as {
            linkId: string;
            links: Array<{ id: string }>;
        };
        expect(site.links.map((link) => link.id)).toEqual([site.linkId, github.linkId]);
        await run("update-link", { linkId: github.linkId, title: "Code" });
        await run("move-link", { linkId: github.linkId, direction: "up" });
        expect(store.getState().documents[resumeId]?.personalInfo.titleLinks.map((link) => link.title)).toEqual([
            "Code",
            "Site",
        ]);
        await run("delete-link", { linkId: site.linkId });
        expect(store.getState().documents[resumeId]?.personalInfo.titleLinks).toHaveLength(1);

        const project = (await run("add-section-entry", {
            section: "projects",
            entry: { title: "Tool" },
        })) as { entryId: string };
        const repo = (await run("add-link", {
            projectId: project.entryId,
            title: "Repo",
            url: "https://github.com/me/tool",
        })) as { linkId: string; projectId: string };
        expect(repo.projectId).toBe(project.entryId);
        await run("update-link", { projectId: project.entryId, linkId: repo.linkId, url: "https://github.com/me/tool2" });
        expect(store.getState().documents[resumeId]?.projects[0]?.links[0]?.url).toBe("https://github.com/me/tool2");
        await expect(runError("add-link", { projectId: "project-nope", url: "https://x.dev" })).resolves.toMatch(
            new RegExp(`Project ids: ${project.entryId}`)
        );
        await expect(runError("delete-link", { linkId: "link-nope" })).resolves.toMatch(/Link ids: /);
    });

    it("renames, reorders, and removes sections", async () => {
        const { resumeId } = (await run("create-resume", {
            sections: ["summary", "experience", "education", "skills"],
        })) as { resumeId: string };
        await run("rename-section", { section: "experience", title: "Work history" });
        const reordered = (await run("reorder-sections", { order: ["skills", "experience"] })) as {
            sections: Array<{ id: string; title: string }>;
        };
        expect(reordered.sections.map((section) => section.id)).toEqual(["skills", "experience", "summary", "education"]);
        expect(reordered.sections[1]?.title).toBe("Work history");
        await run("remove-section", { section: "education" });
        expect(store.getState().documents[resumeId]?.sections.map((section) => section.id)).toEqual([
            "skills",
            "experience",
            "summary",
        ]);
        await expect(runError("rename-section", { section: "awards", title: "Honors" })).resolves.toMatch(
            /not part of this resume's layout/
        );
        await expect(runError("create-resume", { sections: ["hobbies"] })).resolves.toMatch(/"sections\[\]" must be one of/);
    });

    it("edits a background resume without switching the open one", async () => {
        const background = (await run("create-resume", { name: "Background" })) as { resumeId: string };
        const open = (await run("create-resume", { name: "Open" })) as { resumeId: string };
        expect(path).toBe(`/resume/${open.resumeId}`);
        await run("add-section-entry", {
            resumeId: background.resumeId,
            section: "skills",
            entry: { name: "Go" },
        });
        await run("update-summary", { resumeId: background.resumeId, summary: "Background summary" });
        const state = store.getState();
        expect(state.activeDocumentId).toBe(open.resumeId);
        expect(state.currentStep).toBe("personal-info");
        expect(state.documents[background.resumeId]?.skills.map((skill) => skill.name)).toEqual(["Go"]);
        expect(state.documents[background.resumeId]?.sections.some((section) => section.id === "summary")).toBe(true);
        expect(state.documents[open.resumeId]?.skills).toEqual([]);
    });

    it("follows the agent's edits in the open editor without adding undo steps", async () => {
        const { resumeId } = (await run("create-resume", {})) as { resumeId: string };
        const pastBefore = store.getState().history.past.length;
        await run("add-section-entry", { section: "education", entry: { institution: "MIT" } });
        expect(store.getState().currentStep).toBe("education");
        expect(store.getState().history.past.length).toBe(pastBefore + 1);
        // No following while another panel is open.
        await run("open-editor-panel", { resumeId, panel: "sections" });
        await run("update-personal-info", { name: "Someone" });
        expect(store.getState().currentStep).toBe("education");
    });

    it("lists templates with the metadata agents need to choose", async () => {
        const all = (await run("list-templates")) as {
            count: number;
            templates: Array<{ id: string; bestFor: string[]; ats: { rating: string }; pages: string; description: string }>;
        };
        expect(all.count).toBeGreaterThanOrEqual(20);
        for (const template of all.templates) {
            expect(template.description.length).toBeGreaterThan(80);
            expect(template.bestFor.length).toBeGreaterThan(2);
        }
        const multi = (await run("list-templates", { multiPage: true })) as { templates: Array<{ id: string; pages: string }> };
        expect(multi.templates.map((template) => template.id)).toEqual(expect.arrayContaining(["london", "dublin"]));
        expect(multi.templates.every((template) => template.pages === "multi-page")).toBe(true);
        const healthcare = (await run("list-templates", { category: "healthcare" })) as { templates: Array<{ id: string }> };
        expect(healthcare.templates.map((template) => template.id)).toContain("denver");
        await expect(runError("list-templates", { category: "wizards" })).resolves.toMatch(/category/i);
    });

    it("recommends templates for a job with readable reasons", async () => {
        const nurse = (await run("recommend-templates", { jobTitle: "Registered nurse", industry: "hospital" })) as {
            recommendations: Array<{ id: string; reasons: string[] }>;
        };
        expect(nurse.recommendations[0]?.id).toBe("denver");
        expect(nurse.recommendations[0]?.reasons.length).toBeGreaterThan(0);

        const banker = (await run("recommend-templates", { jobTitle: "Investment banking analyst", atsPriority: true, limit: 3 })) as {
            recommendations: Array<{ id: string }>;
        };
        expect(banker.recommendations).toHaveLength(3);
        expect(banker.recommendations[0]?.id).toBe("boston");

        const professor = (await run("recommend-templates", { jobTitle: "Assistant professor", pages: "multi-page" })) as {
            recommendations: Array<{ id: string }>;
        };
        expect(professor.recommendations[0]?.id).toBe("dublin");

        await expect(runError("recommend-templates", {})).resolves.toMatch(/jobTitle/);
    });

    it("applies the template style when creating a resume with a template", async () => {
        const created = (await run("create-resume", { template: "london" })) as { resumeId: string };
        const resume = (await run("get-resume", { resumeId: created.resumeId })) as {
            resume: { settings: { template: string; accentColor: string } };
        };
        expect(resume.resume.settings).toMatchObject({ template: "london", accentColor: "#6d1a36" });
    });

    it("opens the template explorer with search parameters", async () => {
        const created = (await run("create-resume", {})) as { resumeId: string };
        navigations.length = 0;
        const opened = (await run("open-template-explorer", { resumeId: created.resumeId, query: "data scientist" })) as {
            currentPath: string;
        };
        expect(navigations).toEqual([
            { to: "/templates", params: undefined, search: { resume: created.resumeId, q: "data scientist" } },
        ]);
        expect(opened.currentPath).toContain("/templates?");
        await expect(runError("open-template-explorer", { template: "banana" })).resolves.toMatch(/unknown template/i);
    });
});
