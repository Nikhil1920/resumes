/**
 * WebMCP tools for the resume workspace.
 *
 * Tools are the agent-facing surface of the same commands the UI dispatches,
 * so anything an agent does through WebMCP renders, autosaves, and can be
 * undone exactly like a manual edit.  Validation is performed in code with
 * actionable messages (the WebMCP spec advises strict schemas can stall
 * agents; clear errors let them self-correct).
 *
 * The module is host-injected (store + navigation) so it can be exercised in
 * tests without a router or DOM.
 */

import type { StoreApi } from "zustand/vanilla";

import {
    CAREER_LEVEL_LABELS,
    RESUME_TEMPLATE_CATALOG,
    TEMPLATE_CATEGORIES,
    templateStylePatch,
    type CareerLevel,
    type ResumeTemplate,
    type TemplateCategory,
} from "@/features/resume-preview/templates/catalog";
import { RESUME_FONT_OPTIONS } from "@/features/resume-preview/templates/fonts";
import { recommendTemplates } from "@/features/resume-preview/templates/recommend";
import {
    BUILT_IN_SECTION_IDS,
    cleanResumeDocument,
    getCompletion,
    getNavigation,
    type BuiltInSectionId,
    type LanguageProficiency,
    type PersonalInfo,
    type RepeatableEntryInput,
    type RepeatableSection,
    type ResumeDocument,
    type ResumeStep,
} from "@/features/resume-workspace/model";
import type { WorkspaceState } from "@/features/resume-workspace/store";

import type {
    WebmcpToolDefinition,
    WebmcpToolResult,
} from "./model-context";

/**
 * Convert handler failures into readable tool results.  The native WebMCP
 * implementation replaces thrown errors with a generic "the invocation
 * failed" message, which would leave the agent nothing to self-correct on,
 * so every tool returns validation failures as content instead.
 */
const withReadableErrors = (tool: WebmcpToolDefinition): WebmcpToolDefinition => ({
    ...tool,
    async execute(input, options) {
        try {
            return await tool.execute(input, options);
        } catch (error) {
            const detail =
                error instanceof Error ? error.message : String(error);
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error: ${detail}`,
                    },
                ],
            };
        }
    },
});

export interface ResumeToolsHost {
    store: StoreApi<WorkspaceState>;
    /** SPA navigation; must not do a full page reload. */
    navigate(
        to: string,
        params?: Record<string, string>,
        search?: Record<string, string>
    ): Promise<void> | void;
    /** Current route path, used to decide whether navigation is needed. */
    getPath(): string;
    /**
     * Trigger the app's print / Save-as-PDF flow for the currently shown
     * page.  The wiring waits for the preview route to render, then opens the
     * browser print dialog (or downloads via the native bridge).
     */
    printDocument(): Promise<void> | void;
    /** Live-session status, when the app was opened from a live pairing link. */
    getLiveSession?(): LiveSessionSummary;
}

export interface LiveSessionSummary {
    status: string;
    role: "agent" | "user";
    resumeId: string | null;
    peers: Array<{ role: "agent" | "user"; view: string | null; step: string | null }>;
}

/** Thrown for agent-input problems; the message is meant to be read by the agent. */
export class ToolInputError extends Error {}

/**
 * Throw an agent-readable input error.  Generic so it can be used in
 * expression position (`cond ? value : fail<T>("...")`) without relying on
 * never-return control-flow narrowing.
 */
const fail = <T>(message: string): T => {
    throw new ToolInputError(message);
};

const jsonResult = (value: unknown): WebmcpToolResult => ({
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const asRecord = (value: unknown): Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

const optionalString = (value: unknown): string | undefined =>
    typeof value === "string" ? value.trim() : undefined;

const nonEmptyString = (
    source: Record<string, unknown>,
    key: string,
    label: string
): string | undefined => {
    const value = optionalString(source[key]);
    if (value === undefined) return undefined;
    if (!value) fail(`"${key}" (${label}) must be a non-empty string.`);
    return value;
};

const requireEnum = <T extends string>(
    value: unknown,
    allowed: readonly T[],
    label: string
): T => {
    const candidate = optionalString(value);
    if (!candidate || !allowed.includes(candidate as T)) {
        fail(
            `"${label}" must be one of: ${allowed.join(", ")}.` +
                (candidate ? ` Received "${candidate}".` : "")
        );
    }
    return candidate as T;
};

const RESUME_TEMPLATES_VALUES = RESUME_TEMPLATE_CATALOG.map((template) => template.id);
const TEMPLATE_CATEGORY_IDS = TEMPLATE_CATEGORIES.map((category) => category.id);
const CAREER_LEVELS = Object.keys(CAREER_LEVEL_LABELS) as CareerLevel[];

const unknownTemplate = (template: string): never =>
    fail(
        `Unknown template "${template}". Available templates: ${RESUME_TEMPLATES_VALUES.join(", ")}. ` +
            "Call list-templates or recommend-templates to compare them."
    );

/** Everything an agent needs to judge whether a template suits a job. */
const describeTemplate = (template: ResumeTemplate) => ({
    id: template.id,
    name: template.name,
    tagline: template.tagline,
    description: template.description,
    bestFor: template.bestFor,
    industries: template.industries,
    categories: template.categories,
    careerLevels: template.careerLevels,
    layout: template.design.layout,
    ats: template.ats,
    pages: template.pages,
    photo: template.photo,
    multiPageFeatures: {
        runningHeader: template.design.runningHeader,
        pageNumbers: template.design.pageNumbers,
    },
    strengths: template.strengths,
    considerations: template.considerations,
    recommendedSectionOrder: template.recommendedSectionOrder,
    defaults: template.defaults,
});
const PAGE_SIZES = ["A4", "Letter"] as const;
const LANGUAGE_PROFICIENCIES: readonly LanguageProficiency[] = [
    "Basic",
    "Conversational",
    "Proficient",
    "Fluent",
];
const RESUME_STEP_IDS: readonly ResumeStep[] = [
    "personal-info",
    ...BUILT_IN_SECTION_IDS,
];

const COMMON_FONTS = RESUME_FONT_OPTIONS;

/**
 * Entry fields per repeatable section: which are required for a meaningful
 * entry and which are accepted in updates.  `links`- and `skills`-style array
 * fields are normalised separately.
 */
const SECTION_ENTRY_FIELDS: Record<
    RepeatableSection,
    { required: readonly string[]; optional: readonly string[] }
> = {
    experience: {
        required: ["company", "title"],
        optional: ["location", "startDate", "endDate", "description"],
    },
    education: {
        required: ["institution"],
        optional: ["degree", "location", "startDate", "endDate", "description"],
    },
    projects: {
        required: ["title"],
        optional: ["description", "skills", "startDate", "endDate", "links"],
    },
    skills: { required: ["name"], optional: ["category"] },
    certifications: { required: ["name"], optional: ["issuer", "date", "url"] },
    languages: { required: ["name"], optional: ["proficiency"] },
};

const REPEATABLE_SECTIONS = Object.keys(
    SECTION_ENTRY_FIELDS
) as RepeatableSection[];

const ENTRY_FIELD_HINTS =
    "experience: company*, title*, location, startDate, endDate, description. " +
    "education: institution*, degree, location, startDate, endDate, description. " +
    "projects: title*, description, skills (array of strings), startDate, endDate, links (array of {title, url}). " +
    "skills: name*, category. certifications: name*, issuer, date, url. " +
    "languages: name*, proficiency (Basic, Conversational, Proficient, or Fluent). " +
    "(* required) Dates are display strings such as \"Aug 2021\" or \"Present\". " +
    "description accepts plain text or simple HTML (<p>, <ul>/<li>, <strong>, <em>, <a href>).";

const RESUME_ID_PROPERTY = {
    type: "object",
    properties: {
        resumeId: {
            type: "string",
            description:
                "Id of the resume to act on. Omit to use the active resume (the one currently open).",
        },
    },
} as const;

interface RequireDocumentResult {
    resumeId: string;
    document: ResumeDocument;
}

export const createResumeTools = (host: ResumeToolsHost): WebmcpToolDefinition[] => {
    const { store } = host;

    const ensureHydrated = async (): Promise<void> => {
        await store.getState().actions.hydrate();
    };

    /** Resolve the target resume, selecting it so later commands act on it. */
    const requireDocument = async (
        resumeIdInput: unknown
    ): Promise<RequireDocumentResult> => {
        await ensureHydrated();
        const state = store.getState();
        const requestedId = optionalString(resumeIdInput) ?? "";
        const resumeId = requestedId || state.activeDocumentId || "";
        const document = resumeId ? state.documents[resumeId] : undefined;
        if (!document) {
            const available = Object.keys(state.documents);
            const hint = available.length
                ? ` Available resume ids: ${available.join(", ")}.`
                : " No resumes exist yet; call create-resume first.";
            return fail(
                requestedId
                    ? `No resume found with id "${requestedId}".${hint}`
                    : `There is no active resume.${hint}`
            );
        }
        if (state.activeDocumentId !== resumeId) {
            state.actions.selectDocument(resumeId);
        }
        return { resumeId, document };
    };

    const readDocument = (resumeId: string): ResumeDocument | undefined =>
        store.getState().documents[resumeId];

    const isOnDocument = (resumeId: string): boolean =>
        host.getPath() === `/resume/${resumeId}` ||
        host.getPath().startsWith(`/resume/${resumeId}/`);

    /** Validate a repeatable-section entry/patch against its field contract. */
    const normalizeSectionEntry = (
        section: RepeatableSection,
        input: Record<string, unknown>,
        { requireAll }: { requireAll: boolean }
    ): Record<string, unknown> => {
        const contract = SECTION_ENTRY_FIELDS[section];
        const allowed = new Set([...contract.required, ...contract.optional]);
        const unknownKeys = Object.keys(input).filter((key) => !allowed.has(key));
        if (unknownKeys.length > 0) {
            fail(
                `Unknown field(s) for a ${section} entry: ${unknownKeys
                    .map((key) => `"${key}"`)
                    .join(", ")}. Allowed fields: ${Array.from(allowed).join(", ")}.`
            );
        }
        const result: Record<string, unknown> = {};
        for (const key of contract.required) {
            const value = input[key];
            if (requireAll && (typeof value !== "string" || !value.trim())) {
                fail(
                    `A ${section} entry requires "${key}". ${section} entries accept: ${Array.from(
                        allowed
                    ).join(", ")}.`
                );
            }
            if (value !== undefined) result[key] = value;
        }
        for (const key of contract.optional) {
            const value = input[key];
            if (value === undefined) continue;
            if (key === "skills") {
                const skills: string[] = Array.isArray(value)
                    ? value.map((skill) => (typeof skill === "string" ? skill.trim() : ""))
                    : fail(`"skills" must be an array of strings.`);
                if (skills.some((skill) => !skill)) {
                    fail(`"skills" entries must be non-empty strings.`);
                }
                result.skills = skills;
                continue;
            }
            if (key === "links") {
                const links: unknown[] = Array.isArray(value)
                    ? value
                    : fail(`"links" must be an array of {title, url} objects.`);
                result.links = links.map((link, index) => {
                    const record = asRecord(link);
                    const url =
                        nonEmptyString(record, "url", `links[${index}].url`) ??
                        fail(`links[${index}] requires a "url". Each link accepts {title, url}.`);
                    const title = nonEmptyString(record, "title", `links[${index}].title`);
                    return { ...(title !== undefined ? { title } : {}), url };
                });
                continue;
            }
            if (key === "proficiency") {
                result.proficiency = requireEnum(
                    value,
                    LANGUAGE_PROFICIENCIES,
                    "proficiency"
                );
                continue;
            }
            if (typeof value !== "string") {
                fail(`"${key}" must be a string.`);
            }
            result[key] = value;
        }
        return result;
    };

    const entryList = (
        document: ResumeDocument,
        section: RepeatableSection
    ): Array<{ id: string }> => {
        const items = document[section] as Array<{ id: string }> | undefined;
        return Array.isArray(items) ? items : [];
    };

    const definitions: WebmcpToolDefinition[] = [
        {
            name: "get-workspace",
            description:
                "List every resume stored in this browser with its completion progress, " +
                "plus which resume is active and where the user currently is in the app " +
                "(dashboard, editor, or preview). Start here to discover resume ids.",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                await ensureHydrated();
                const state = store.getState();
                const resumes = Object.values(state.documents).map((document) => {
                    const completion = getCompletion(document);
                    return {
                        id: document.meta.id,
                        name: document.meta.name || "Untitled resume",
                        description: document.meta.description,
                        completionPercent: completion.percent,
                        completedSections: completion.completed,
                        totalSections: completion.total,
                        currentStep: document.meta.step,
                        createdAt: document.meta.createdAt,
                        updatedAt: document.meta.updatedAt,
                    };
                });
                const activeId = state.activeDocumentId;
                const path = host.getPath();
                return jsonResult({
                    resumes,
                    activeResumeId: activeId,
                    currentStep: state.currentStep,
                    currentPath: path,
                    location:
                        path === "/"
                            ? "dashboard"
                            : path.endsWith("/preview")
                              ? "preview"
                              : path.startsWith("/resume/")
                                ? "editor"
                                : path.startsWith("/templates")
                                  ? "template-explorer"
                                  : "other",
                    hydration: state.persistence.hydration,
                    saveStatus: state.persistence.save,
                });
            },
        },
        {
            name: "get-resume",
            description:
                "Read the full content of one resume: personal info, summary, experience, " +
                "education, projects, skills, certifications, awards, languages, section " +
                "layout, and appearance settings. Blank draft rows are omitted.",
            inputSchema: RESUME_ID_PROPERTY,
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const document = readDocument(resumeId);
                if (!document) {
                    return fail(`No resume found with id "${resumeId}".`);
                }
                return jsonResult({
                    resume: cleanResumeDocument(document),
                    completion: getCompletion(document),
                });
            },
        },
        {
            name: "create-resume",
            description:
                "Create a new empty resume, make it the active resume, and open it in the " +
                "step-by-step editor. Then fill it with update-personal-info, update-summary, " +
                "add-section-entry, and finally open-preview.",
            inputSchema: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description:
                            "Display name shown in the dashboard and editor toolbar, e.g. " +
                            "\"Vyshnav - Java Backend Developer\".",
                    },
                    description: {
                        type: "string",
                        description: "Optional note about this resume, shown on the dashboard.",
                    },
                    template: {
                        type: "string",
                        description:
                            "Optional initial template id; its designed fonts and accent color are applied too. " +
                            "Use recommend-templates with the target job title to choose one. Ids: " +
                            `${RESUME_TEMPLATES_VALUES.join(", ")}. Defaults to tenali (Tenali Modern).`,
                    },
                    pageSize: {
                        type: "string",
                        description:
                            "Optional initial page size: A4 or Letter. Defaults to A4.",
                    },
                },
            },
            async execute(input) {
                await ensureHydrated();
                const name = optionalString(input.name) || "Untitled resume";
                const description = optionalString(input.description);
                const template = optionalString(input.template);
                if (template && !RESUME_TEMPLATES_VALUES.includes(template)) {
                    unknownTemplate(template);
                }
                const pageSize = optionalString(input.pageSize);
                if (pageSize && !PAGE_SIZES.includes(pageSize as "A4" | "Letter")) {
                    fail(`"pageSize" must be one of: ${PAGE_SIZES.join(", ")}.`);
                }
                const documentId = store.getState().actions.createDocument({
                    name,
                    ...(description ? { description } : {}),
                    ...(template ? { template } : {}),
                    ...(pageSize ? { pageSize: pageSize as "A4" | "Letter" } : {}),
                });
                if (!documentId) fail("The resume could not be created.");
                if (template) {
                    store.getState().actions.updateDocumentSettings(templateStylePatch(template));
                }
                await host.navigate("/resume/$documentId", { documentId });
                return jsonResult({
                    resumeId: documentId,
                    name,
                    editPath: `/resume/${documentId}`,
                    previewPath: `/resume/${documentId}/preview`,
                    currentStep: "personal-info",
                });
            },
        },
        {
            name: "delete-resume",
            description:
                "Permanently delete a resume from this browser. If it was the active resume " +
                "the app returns to the dashboard. This cannot be undone with this tool.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: {
                        type: "string",
                        description:
                            "Id of the resume to delete. Omit to delete the active resume.",
                    },
                },
                required: ["resumeId"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const wasActive = store.getState().activeDocumentId === resumeId;
                const wasOpen = isOnDocument(resumeId);
                store.getState().actions.deleteDocument(resumeId);
                if (wasActive || wasOpen) {
                    await host.navigate("/");
                }
                return jsonResult({
                    deletedResumeId: resumeId,
                    remainingResumes: Object.keys(store.getState().documents).length,
                });
            },
        },
        {
            name: "set-builder-step",
            description:
                "Move the editor to a specific step (personal info, summary, experience, ...) " +
                "and open the editor if needed. The step must be a section enabled on the " +
                "resume; enable hidden sections with set-section-visibility first.",
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    step: {
                        type: "string",
                        description:
                            "Editor step to open, one of: " +
                            `${RESUME_STEP_IDS.join(", ")}.`,
                    },
                },
                required: ["step"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const step = requireEnum<ResumeStep>(
                    input.step,
                    RESUME_STEP_IDS,
                    "step"
                );
                const stepSection = document.sections.find(
                    (candidate) => candidate.id === step
                );
                if (step !== "personal-info" && (!stepSection || !stepSection.visible)) {
                    return fail(
                        stepSection
                            ? `Section "${step}" exists but is hidden on this resume. Show it with set-section-visibility first, or choose one of: personal-info, ` +
                              `${document.sections
                                  .filter((section) => section.visible)
                                  .map((section) => section.id)
                                  .join(", ")}.`
                            : `Section "${step}" is not enabled on this resume. Enable it with ` +
                              `set-section-visibility first, or choose one of: personal-info, ` +
                              `${document.sections
                                  .filter((section) => section.visible)
                                  .map((section) => section.id)
                                  .join(", ")}.`
                    );
                }
                if (host.getPath().replace(/\/$/, "") !== `/resume/${resumeId}`) {
                    await host.navigate("/resume/$documentId", { documentId: resumeId });
                }
                store.getState().actions.setCurrentStep(step);
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    step,
                    stepTitle:
                        (fresh ? getNavigation(fresh, step).current?.title : undefined) ?? step,
                });
            },
        },
        {
            name: "open-preview",
            description:
                "Open the full-page resume preview, where the template, page size, fonts, and " +
                "accent color can be changed. Use export-pdf when the user wants to save the " +
                "resume as a PDF.",
            inputSchema: RESUME_ID_PROPERTY,
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                await host.navigate("/resume/$documentId/preview", {
                    documentId: resumeId,
                });
                return jsonResult({
                    resumeId,
                    previewPath: `/resume/${resumeId}/preview`,
                    pdfHint:
                        "Call export-pdf to open the browser's Save-as-PDF dialog for this resume.",
                });
            },
        },
        {
            name: "export-pdf",
            description:
                "Export the resume as a PDF with the user in the loop: opens the full-page " +
                "preview and then the browser's print dialog, where the user confirms and " +
                "chooses Save as PDF. The print dialog itself is browser UI and cannot be " +
                "driven by an agent. On native (Capacitor) builds this downloads the PDF " +
                "directly instead of showing a dialog.",
            inputSchema: RESUME_ID_PROPERTY,
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                await host.navigate("/resume/$documentId/preview", {
                    documentId: resumeId,
                });
                await host.printDocument();
                return jsonResult({
                    resumeId,
                    previewPath: `/resume/${resumeId}/preview`,
                    status: "print-flow-started",
                    userStep:
                        "The preview is on screen with the print dialog open; the user confirms " +
                        "and chooses Save as PDF to finish the export.",
                });
            },
        },
        {
            name: "go-to-dashboard",
            description:
                "Navigate back to the resume dashboard (the list of all saved resumes).",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                await host.navigate("/");
                return jsonResult({ currentPath: "/" });
            },
        },
        {
            name: "update-personal-info",
            description:
                "Set the resume owner's contact details: full name, professional headline, " +
                "email, phone, location, and headline links (LinkedIn, GitHub, portfolio...). Providing links replaces " +
                "the existing link list. Acts on the active resume unless resumeId is given.",
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    name: { type: "string", description: "Full name, e.g. \"Vyshnav Reddy\"." },
                    headline: {
                        type: "string",
                        description:
                            "Professional headline shown under the name by every template, e.g. " +
                            "\"Senior Backend Engineer\" or \"Registered Nurse, ICU\". Pass an empty string to clear it.",
                    },
                    location: {
                        type: "string",
                        description:
                            "City/region or work arrangement shown with the contact details, e.g. " +
                            "\"Austin, TX\" or \"Remote (EU)\". Pass an empty string to clear it.",
                    },
                    email: { type: "string", description: "Contact email address." },
                    phone: { type: "string", description: "Contact phone number." },
                    links: {
                        type: "array",
                        description:
                            "Headline links. Each item needs a url and optionally a title, " +
                            'e.g. { "title": "LinkedIn", "url": "https://linkedin.com/in/..." }.',
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                url: { type: "string" },
                            },
                        },
                    },
                },
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const patch: Partial<PersonalInfo> = {};
                const name = nonEmptyString(input, "name", "full name");
                const email = nonEmptyString(input, "email", "email address");
                const phone = nonEmptyString(input, "phone", "phone number");
                if (name !== undefined) patch.name = name;
                if (email !== undefined) {
                    if (!/^\S+@\S+\.\S+$/.test(email)) {
                        fail(
                            `"email" must look like name@example.com. Received "${email}".`
                        );
                    }
                    patch.email = email;
                }
                if (phone !== undefined) patch.phone = phone;
                // Headline and location are optional display lines, so an
                // empty string is a valid way to clear them.
                const headline = optionalString(input.headline);
                const location = optionalString(input.location);
                if (headline !== undefined) patch.headline = headline;
                if (location !== undefined) patch.location = location;
                if (input.links !== undefined) {
                    const links: unknown[] = Array.isArray(input.links)
                        ? input.links
                        : fail(`"links" must be an array of {title, url} objects.`);
                    // Link ids are (re)assigned by the workspace normaliser when
                    // the patch is applied, so the cast omits them safely.
                    patch.titleLinks = links.map((link, index) => {
                        const record = asRecord(link);
                        const url =
                            nonEmptyString(record, "url", `links[${index}].url`) ??
                            fail(`links[${index}] requires a "url".`);
                        const title = nonEmptyString(record, "title", `links[${index}].title`);
                        return { title: title ?? "", url };
                    }) as PersonalInfo["titleLinks"];
                }
                if (Object.keys(patch).length === 0) {
                    fail(
                        "Provide at least one of: name, headline, email, phone, location, links."
                    );
                }
                store.getState().actions.updateDocument({ personalInfo: patch }, resumeId);
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    personalInfo: fresh?.personalInfo ?? patch,
                });
            },
        },
        {
            name: "update-summary",
            description:
                "Set the professional summary shown at the top of the resume. Write 2-4 " +
                "sentences describing the person's role, years of experience, and strengths. " +
                "Accepts plain text or simple HTML (<p>, <ul>/<li>, <strong>, <em>, <a>). " +
                "Pass an empty string to clear it.",
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    summary: { type: "string", description: "The summary text (HTML allowed)." },
                },
                required: ["summary"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                if (typeof input.summary !== "string") {
                    return fail(`"summary" must be a string.`);
                }
                store.getState().actions.updateDocument({ summary: input.summary }, resumeId);
                const fresh = readDocument(resumeId);
                return jsonResult({ resumeId, summary: fresh?.summary ?? input.summary });
            },
        },
        {
            name: "update-awards",
            description:
                "Set the awards and recognitions section content. Accepts plain text or simple " +
                "HTML (<p>, <ul>/<li>, <strong>, <em>, <a>). Pass an empty string to clear it.",
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    awards: { type: "string", description: "The awards content (HTML allowed)." },
                },
                required: ["awards"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                if (typeof input.awards !== "string") {
                    return fail(`"awards" must be a string.`);
                }
                store.getState().actions.updateDocument({ awards: input.awards }, resumeId);
                const fresh = readDocument(resumeId);
                return jsonResult({ resumeId, awards: fresh?.awards ?? input.awards });
            },
        },
        {
            name: "add-section-entry",
            description:
                "Add one entry to a repeatable resume section and return its entryId. " +
                ENTRY_FIELD_HINTS,
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    section: {
                        type: "string",
                        description:
                            "Which section to add the entry to, one of: " +
                            `${REPEATABLE_SECTIONS.join(", ")}.`,
                    },
                    entry: {
                        type: "object",
                        description: `Fields for the new entry. ${ENTRY_FIELD_HINTS}`,
                    },
                },
                required: ["section", "entry"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const section = requireEnum<RepeatableSection>(
                    input.section,
                    REPEATABLE_SECTIONS,
                    "section"
                );
                const entryInput = asRecord(input.entry);
                if (Object.keys(entryInput).length === 0) {
                    fail(
                        `"entry" must be an object with the fields of a ${section} entry. Required: ${SECTION_ENTRY_FIELDS[section].required.join(", ")}. ${ENTRY_FIELD_HINTS}`
                    );
                }
                const entry = normalizeSectionEntry(section, entryInput, {
                    requireAll: true,
                });
                const entryId = store
                    .getState()
                    .actions.createEntry(section, entry as RepeatableEntryInput);
                if (!entryId) {
                    return fail(
                        `The ${section} entry could not be added. Make sure the resume "${resumeId}" still exists.`
                    );
                }
                const fresh = readDocument(resumeId);
                const created = fresh
                    ? entryList(fresh, section).find((item) => item.id === entryId)
                    : undefined;
                return jsonResult({ resumeId, section, entryId, entry: created });
            },
        },
        {
            name: "update-section-entry",
            description:
                "Update fields of an existing entry in a repeatable section. Only provided " +
                `fields change. ${ENTRY_FIELD_HINTS} Use get-resume to find entryIds.`,
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    section: {
                        type: "string",
                        description:
                            "Which section the entry belongs to, one of: " +
                            `${REPEATABLE_SECTIONS.join(", ")}.`,
                    },
                    entryId: {
                        type: "string",
                        description: "Id of the entry to update (from add-section-entry or get-resume).",
                    },
                    patch: {
                        type: "object",
                        description: `Fields to change. ${ENTRY_FIELD_HINTS}`,
                    },
                },
                required: ["section", "entryId", "patch"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireEnum<RepeatableSection>(
                    input.section,
                    REPEATABLE_SECTIONS,
                    "section"
                );
                const entryId = optionalString(input.entryId);
                if (!entryId) {
                    return fail(`"entryId" must be a non-empty string.`);
                }
                const existing = entryList(document, section).find(
                    (item) => item.id === entryId
                );
                if (!existing) {
                    const ids = entryList(document, section).map((item) => item.id);
                    return fail(
                        `No ${section} entry with id "${entryId}".` +
                            (ids.length
                                ? ` Existing ${section} entry ids: ${ids.join(", ")}.`
                                : ` This resume has no ${section} entries yet.`)
                    );
                }
                const patchInput = asRecord(input.patch);
                if (Object.keys(patchInput).length === 0) {
                    return fail(`"patch" must contain at least one field to change.`);
                }
                const patch = normalizeSectionEntry(section, patchInput, {
                    requireAll: false,
                });
                store.getState().actions.updateEntry(section, entryId, patch);
                const fresh = readDocument(resumeId);
                const updated = fresh
                    ? entryList(fresh, section).find((item) => item.id === entryId)
                    : undefined;
                return jsonResult({ resumeId, section, entryId, entry: updated });
            },
        },
        {
            name: "delete-section-entry",
            description:
                "Delete one entry from a repeatable resume section (experience, education, " +
                "projects, skills, certifications, or languages).",
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    section: {
                        type: "string",
                        description:
                            "Which section the entry belongs to, one of: " +
                            `${REPEATABLE_SECTIONS.join(", ")}.`,
                    },
                    entryId: { type: "string", description: "Id of the entry to delete." },
                },
                required: ["section", "entryId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireEnum<RepeatableSection>(
                    input.section,
                    REPEATABLE_SECTIONS,
                    "section"
                );
                const entryId = optionalString(input.entryId);
                if (!entryId) {
                    return fail(`"entryId" must be a non-empty string.`);
                }
                const existing = entryList(document, section).some(
                    (item) => item.id === entryId
                );
                if (!existing) {
                    const ids = entryList(document, section).map((item) => item.id);
                    return fail(
                        `No ${section} entry with id "${entryId}".` +
                            (ids.length
                                ? ` Existing ${section} entry ids: ${ids.join(", ")}.`
                                : ` This resume has no ${section} entries yet.`)
                    );
                }
                store.getState().actions.deleteEntry(section, entryId);
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    section,
                    deletedEntryId: entryId,
                    remainingEntries: fresh ? entryList(fresh, section).length : 0,
                });
            },
        },
        {
            name: "set-section-visibility",
            description:
                "Show or hide a resume section (summary, experience, education, projects, " +
                "skills, certifications, awards, languages). Enabling a section that was " +
                "removed adds it back to the end of the editor steps.",
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    section: {
                        type: "string",
                        description:
                            "Which section to show or hide, one of: " +
                            `${BUILT_IN_SECTION_IDS.join(", ")}.`,
                    },
                    enabled: { type: "boolean", description: "True to show, false to hide." },
                },
                required: ["section", "enabled"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireEnum<BuiltInSectionId>(
                    input.section,
                    BUILT_IN_SECTION_IDS,
                    "section"
                );
                if (typeof input.enabled !== "boolean") {
                    fail(`"enabled" must be true or false.`);
                }
                const present = document.sections.some((item) => item.id === section);
                if (input.enabled && !present) {
                    store.getState().actions.addSection(section);
                } else if (present) {
                    store.getState().actions.setSectionVisibility(section, input.enabled === true);
                }
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    section,
                    enabled: input.enabled,
                    sections:
                        fresh?.sections.map((item) => ({
                            id: item.id,
                            title: item.title,
                            visible: item.visible,
                        })) ?? [],
                });
            },
        },
        {
            name: "list-templates",
            description:
                "List the resume templates with everything needed to choose one: description, " +
                "job titles and industries each suits, career levels, applicant-tracking-system " +
                "(ATS) rating and notes, single- or two-column layout, whether it is built for " +
                "one page or multi-page CVs, photo support, strengths, trade-offs, and the " +
                "recommended section order. Optional filters narrow the list. To rank templates " +
                "for a specific job, prefer recommend-templates.",
            inputSchema: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        description: `Job family filter, one of: ${TEMPLATE_CATEGORY_IDS.join(", ")}.`,
                    },
                    careerLevel: {
                        type: "string",
                        description: `Only templates suited to this level: ${CAREER_LEVELS.join(", ")}.`,
                    },
                    atsExcellent: {
                        type: "boolean",
                        description: "Only templates rated excellent for applicant tracking systems.",
                    },
                    photo: {
                        type: "boolean",
                        description: "Only templates that can show a profile photo.",
                    },
                    multiPage: {
                        type: "boolean",
                        description: "Only templates designed for multi-page resumes/CVs.",
                    },
                    layout: {
                        type: "string",
                        description: "single-column or two-column.",
                    },
                },
            },
            async execute(input) {
                let templates: readonly ResumeTemplate[] = RESUME_TEMPLATE_CATALOG;
                const category = optionalString(input.category);
                if (category !== undefined) {
                    const value = requireEnum(category, TEMPLATE_CATEGORY_IDS, "category") as TemplateCategory;
                    templates = templates.filter((template) => template.categories.includes(value));
                }
                const careerLevel = optionalString(input.careerLevel);
                if (careerLevel !== undefined) {
                    const value = requireEnum(careerLevel, CAREER_LEVELS, "careerLevel");
                    templates = templates.filter((template) => template.careerLevels.includes(value));
                }
                if (input.atsExcellent === true) {
                    templates = templates.filter((template) => template.ats.rating === "excellent");
                }
                if (input.photo === true) {
                    templates = templates.filter((template) => template.photo !== "none");
                }
                if (input.multiPage === true) {
                    templates = templates.filter((template) => template.pages === "multi-page");
                }
                const layout = optionalString(input.layout);
                if (layout !== undefined) {
                    const value = requireEnum(layout, ["single-column", "two-column"] as const, "layout");
                    templates = templates.filter((template) =>
                        value === "single-column"
                            ? template.design.layout === "single-column"
                            : template.design.layout !== "single-column"
                    );
                }
                return jsonResult({
                    count: templates.length,
                    categories: TEMPLATE_CATEGORIES,
                    templates: templates.map(describeTemplate),
                    howToApply:
                        "Call set-appearance with { template: <id> } (or create-resume with template) to use one.",
                });
            },
        },
        {
            name: "recommend-templates",
            description:
                "Rank resume templates for a specific job application. Pass the target job title " +
                "and, when known, the industry, career level, region, and whether a photo or strict " +
                "ATS compatibility matters. Returns the best matches with plain-language reasons you " +
                "can share with the user, then apply one with set-appearance.",
            inputSchema: {
                type: "object",
                properties: {
                    jobTitle: {
                        type: "string",
                        description: 'Target role, e.g. "Senior backend engineer" or "ICU registered nurse".',
                    },
                    industry: {
                        type: "string",
                        description: 'Industry or employer type, e.g. "investment banking", "hospital", "SaaS startup".',
                    },
                    jobDescription: {
                        type: "string",
                        description: "Optional job posting text; only keywords are used.",
                    },
                    careerLevel: {
                        type: "string",
                        description: `One of: ${CAREER_LEVELS.join(", ")}.`,
                    },
                    region: {
                        type: "string",
                        description:
                            'Country or region of the application, e.g. "US", "UK", "Germany", "UAE". ' +
                            "Used to decide whether a photo is customary.",
                    },
                    photo: {
                        type: "string",
                        description: '"include" to favor templates with a photo, "exclude" to avoid photo-first designs.',
                    },
                    atsPriority: {
                        type: "boolean",
                        description:
                            "True when the resume will go through an online application portal or ATS; favors single-column, plain templates.",
                    },
                    pages: {
                        type: "string",
                        description: '"one-page" or "multi-page" (long CVs, executive or academic histories).',
                    },
                    limit: {
                        type: "number",
                        description: "How many templates to return (1-10). Defaults to 5.",
                    },
                },
            },
            async execute(input) {
                const jobTitle = optionalString(input.jobTitle);
                const industry = optionalString(input.industry);
                const jobDescription = optionalString(input.jobDescription);
                if (!jobTitle && !industry && !jobDescription) {
                    fail('Provide at least one of: jobTitle, industry, jobDescription.');
                }
                const careerLevel = optionalString(input.careerLevel);
                const photo = optionalString(input.photo);
                const pages = optionalString(input.pages);
                const limitInput = typeof input.limit === "number" ? Math.round(input.limit) : 5;
                const ranked = recommendTemplates(
                    {
                        jobTitle,
                        industry,
                        jobDescription: jobDescription?.slice(0, 4000),
                        region: optionalString(input.region),
                        careerLevel: careerLevel ? requireEnum(careerLevel, CAREER_LEVELS, "careerLevel") : undefined,
                        photo: photo ? requireEnum(photo, ["include", "exclude"] as const, "photo") : undefined,
                        atsPriority: input.atsPriority === true,
                        pages: pages ? requireEnum(pages, ["one-page", "multi-page"] as const, "pages") : undefined,
                    },
                    Math.min(10, Math.max(1, limitInput))
                );
                return jsonResult({
                    recommendations: ranked.map(({ template, score, reasons }) => ({
                        id: template.id,
                        name: template.name,
                        score,
                        reasons,
                        tagline: template.tagline,
                        bestFor: template.bestFor,
                        layout: template.design.layout,
                        ats: template.ats.rating,
                        pages: template.pages,
                        photo: template.photo,
                        recommendedSectionOrder: template.recommendedSectionOrder,
                    })),
                    howToApply:
                        "Apply the chosen id with set-appearance { template }. Optionally reorder sections to match recommendedSectionOrder with set-section-visibility and the editor.",
                });
            },
        },
        {
            name: "open-template-explorer",
            description:
                "Open the visual template explorer so the user can compare templates with realistic " +
                "sample content. Pass resumeId to let the user preview and apply templates to that " +
                "resume, a search query (job title or industry) to pre-rank templates, or a " +
                "template id to open its detail view.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: {
                        type: "string",
                        description: "Resume to restyle from the explorer (shows an Apply button).",
                    },
                    query: {
                        type: "string",
                        description: 'Job title or industry to rank by, e.g. "data scientist".',
                    },
                    template: {
                        type: "string",
                        description: "Template id to open in the detail view.",
                    },
                    category: {
                        type: "string",
                        description: `Job family filter, one of: ${TEMPLATE_CATEGORY_IDS.join(", ")}.`,
                    },
                },
            },
            async execute(input) {
                await ensureHydrated();
                const search: Record<string, string> = {};
                const resumeId = optionalString(input.resumeId);
                if (resumeId) {
                    if (!store.getState().documents[resumeId]) fail(`No resume found with id "${resumeId}".`);
                    search.resume = resumeId;
                }
                const query = optionalString(input.query);
                if (query) search.q = query;
                const template = optionalString(input.template);
                if (template) {
                    if (!RESUME_TEMPLATES_VALUES.includes(template)) unknownTemplate(template);
                    search.template = template;
                }
                const category = optionalString(input.category);
                if (category) search.category = requireEnum(category, TEMPLATE_CATEGORY_IDS, "category");
                await host.navigate("/templates", undefined, search);
                const params = new URLSearchParams(search).toString();
                return jsonResult({ currentPath: `/templates${params ? `?${params}` : ""}` });
            },
        },
        {
            name: "set-appearance",
            description:
                "Change the resume's appearance: template, page size, title/body font, and accent " +
                "color. Choosing a template also applies that template's own fonts and accent color " +
                "(its designed look) unless keepCurrentStyle is true; any font or color you pass " +
                "explicitly wins. Pick templates with recommend-templates or list-templates. " +
                `Fonts: ${COMMON_FONTS.join(", ")} ("Template default" uses the template's fonts).`,
            inputSchema: {
                type: "object",
                properties: {
                    ...RESUME_ID_PROPERTY.properties,
                    template: {
                        type: "string",
                        description:
                            "One of the built-in template ids: " +
                            `${RESUME_TEMPLATES_VALUES.join(", ")}.`,
                    },
                    keepCurrentStyle: {
                        type: "boolean",
                        description:
                            "When switching templates, keep the resume's current fonts and accent color " +
                            "instead of adopting the template's designed style. Defaults to false.",
                    },
                    pageSize: {
                        type: "string",
                        description:
                            "Printed page size: A4 (most countries) or Letter (US and Canada).",
                    },
                    titleFont: { type: "string", description: "Font used for headings." },
                    bodyFont: { type: "string", description: "Font used for body text." },
                    accentColor: {
                        type: "string",
                        description: 'Hex color like "#004aad", used for headings, rules, and links.',
                    },
                },
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const patch: Record<string, string> = {};
                const template = optionalString(input.template);
                if (template !== undefined) {
                    if (!RESUME_TEMPLATES_VALUES.includes(template)) {
                        unknownTemplate(template);
                    }
                    Object.assign(
                        patch,
                        input.keepCurrentStyle === true ? { template } : templateStylePatch(template)
                    );
                }
                const pageSize = optionalString(input.pageSize);
                if (pageSize !== undefined) {
                    patch.pageSize = requireEnum(pageSize, PAGE_SIZES, "pageSize");
                }
                const titleFont = nonEmptyString(input, "titleFont", "title font");
                const bodyFont = nonEmptyString(input, "bodyFont", "body font");
                if (titleFont !== undefined) patch.titleFont = titleFont;
                if (bodyFont !== undefined) patch.bodyFont = bodyFont;
                const accentColor = optionalString(input.accentColor);
                if (accentColor !== undefined) {
                    if (!/^#[0-9a-f]{6}$/i.test(accentColor)) {
                        fail(
                            `"accentColor" must be a hex color like "#004aad". Received "${accentColor}".`
                        );
                    }
                    patch.accentColor = accentColor;
                }
                if (Object.keys(patch).length === 0) {
                    fail(
                        "Provide at least one of: template, pageSize, titleFont, bodyFont, accentColor."
                    );
                }
                store.getState().actions.updateDocumentSettings(patch);
                const fresh = readDocument(resumeId);
                return jsonResult({ resumeId, settings: fresh?.settings ?? patch });
            },
        },
        {
            name: "export-resume",
            description:
                "Export one resume as portable JSON (the same format used by the app's JSON " +
                "download and import). Waits for pending autosave so the export matches what " +
                "is stored. Returns the JSON document as text.",
            inputSchema: RESUME_ID_PROPERTY,
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                await store.getState().actions.flushSave();
                const payload = store.getState().actions.exportDocument(resumeId);
                if (!payload) {
                    return fail(`No resume found with id "${resumeId}".`);
                }
                return { content: [{ type: "text", text: payload }] };
            },
        },
        {
            name: "get-live-session",
            description:
                "Report the live session this page is part of, if any. A live session shares one " +
                "resume between this browser and another on the same computer (for example an " +
                "agent's headless browser and the user's own browser) through a local relay started " +
                "with `node scripts/live-relay.mjs --resume <id>`. Edits from either side appear in " +
                "both, so call get-resume to see the user's latest changes. Returns the status " +
                "(off, connecting, waiting, live, reconnecting, blocked, ended) and where each other " +
                "participant is (view and step).",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                const session = host.getLiveSession?.() ?? { status: "off", role: "user", resumeId: null, peers: [] };
                return jsonResult({
                    ...session,
                    hint:
                        session.status === "off"
                            ? "Not in a live session. Open the agent link printed by scripts/live-relay.mjs to join one."
                            : session.status === "blocked"
                              ? "Cannot reach the relay. Launch this browser with --disable-features=LocalNetworkAccessChecks and check that the relay is running."
                              : undefined,
                });
            },
        },
    ];
    return definitions.map(withReadableErrors);
};
