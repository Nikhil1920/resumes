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
const navigations: Array<{ to: string; params?: Record<string, string>; search?: Record<string, string> }> = [];
const printCalls: number[] = [];
const store = createResumeWorkspaceStore({ persistence: null, autoHydrate: false });
const tools = createResumeTools({
    store,
    async navigate(to, params, search) {
        navigations.push({ to, params, ...(search ? { search } : {}) });
        path = to === "/" ? "/" : to.replace("$documentId", params?.documentId ?? "");
    },
    getPath: () => path,
    printDocument: async () => {
        printCalls.push(Date.now());
    },
});

beforeEach(() => {
    navigations.length = 0;
    printCalls.length = 0;
    path = "/";
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
            "delete-resume",
            "set-builder-step",
            "open-preview",
            "export-pdf",
            "go-to-dashboard",
            "update-personal-info",
            "update-summary",
            "update-awards",
            "add-section-entry",
            "update-section-entry",
            "delete-section-entry",
            "set-section-visibility",
            "list-templates",
            "recommend-templates",
            "open-template-explorer",
            "set-appearance",
            "export-resume",
        ]);
        for (const tool of tools) {
            expect(tool.description.length).toBeGreaterThan(20);
            expect(tool.inputSchema).toMatchObject({ type: "object" });
        }
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
