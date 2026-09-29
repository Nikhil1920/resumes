/**
 * WebMCP tools for the resume workspace.
 *
 * Tools are the agent-facing surface of the same commands the UI dispatches,
 * so anything an agent does through WebMCP renders, autosaves, and can be
 * undone exactly like a manual edit.  Every control in the editor has a tool
 * counterpart: resume details, personal info and photo, each section's
 * entries and links (including their order), the section layout, appearance,
 * the editor's steps and panels, undo/redo, preview, and export.
 *
 * Validation is performed in code with actionable messages (the WebMCP spec
 * advises strict schemas can stall agents; clear errors let them
 * self-correct).  Content edits target the resume by id rather than relying
 * on whichever resume the UI has selected, so an open editor can never
 * redirect an agent's write.
 *
 * The module is host-injected (store + navigation) so it can be exercised in
 * tests without a router or DOM.
 */

import type { StoreApi } from "zustand/vanilla";

import {
    EDITOR_PANELS,
    editorPanelSearch,
    parseEditorPanel,
    type EditorPanel,
} from "@/features/resume-builder/editor-panel";
import { RESUME_TEMPLATES } from "@/features/resume-preview/presentation";
import { createSampleResumePayload } from "@/features/resume-workspace/demo";
import {
    BUILT_IN_SECTION_IDS,
    BUILT_IN_SECTIONS,
    cleanResumeDocument,
    getCompletion,
    getNavigation,
    isPortraitImageValue,
    type BuiltInSectionId,
    type LanguageProficiency,
    type PersonalInfo,
    type RepeatableEntryInput,
    type RepeatableSection,
    type ResumeDocument,
    type ResumeLink,
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
    /** Current route search params; the editor keeps its open panel there. */
    getSearch?(): Record<string, unknown>;
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

const RESUME_TEMPLATES_VALUES = RESUME_TEMPLATES.map((template) => template.value);
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
const MOVE_DIRECTIONS = ["up", "down", "top", "bottom"] as const;
type MoveDirection = (typeof MOVE_DIRECTIONS)[number];

const COMMON_FONTS = ["Arial", "Inter", "Georgia", "Helvetica", "Times New Roman"];

/** Hrefs the preview renders as links; anything else shows as plain text. */
const isLinkableUrl = (value: string): boolean =>
    /^(?:https?:|mailto:|tel:|\/|#)/i.test(value.trim());

const linkWarnings = (urls: readonly string[]): string[] =>
    urls
        .filter((url) => url && !isLinkableUrl(url))
        .map(
            (url) =>
                `"${url}" has no scheme, so the resume shows it as plain text. Use a full URL such as "https://${url.replace(/^\/+/, "")}".`
        );

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

const RESUME_ID_SCHEMA = {
    type: "string",
    description:
        "Id of the resume to act on. Omit to use the active resume (the one currently open).",
} as const;

const RESUME_ID_PROPERTY = {
    type: "object",
    properties: { resumeId: RESUME_ID_SCHEMA },
} as const;

const SECTION_ENTRY_PROPERTIES = {
    section: {
        type: "string",
        description: `Repeatable section, one of: ${REPEATABLE_SECTIONS.join(", ")}.`,
    },
    entryId: {
        type: "string",
        description: "Id of the entry (from add-section-entry or get-resume).",
    },
} as const;

const MOVE_PROPERTIES = {
    toIndex: {
        type: "integer",
        description: "Zero-based position to move to. Use this or direction.",
    },
    direction: {
        type: "string",
        description: `Relative move instead of toIndex: ${MOVE_DIRECTIONS.join(", ")}.`,
    },
} as const;

const LINK_OWNER_PROPERTY = {
    projectId: {
        type: "string",
        description:
            "Project entry id for a project's links. Omit for the headline links under the name in personal info.",
    },
} as const;

const RESUME_JSON_HINT =
    "Shape: { \"meta\": { \"name\" }, \"personalInfo\": { \"name\", \"email\", \"phone\", \"titleLinks\": [{ \"title\", \"url\" }] }, " +
    "\"summary\": \"<p>...</p>\", \"experience\": [{ \"company\", \"title\", \"location\", \"startDate\", \"endDate\", \"description\" }], " +
    "\"education\": [...], \"projects\": [...], \"skills\": [{ \"name\", \"category\" }], \"certifications\": [...], " +
    "\"awards\": \"<p>...</p>\", \"languages\": [{ \"name\", \"proficiency\" }], " +
    "\"sections\": [\"summary\", \"experience\", ...] (order and which sections show), " +
    "\"settings\": { \"template\", \"pageSize\", \"titleFont\", \"bodyFont\", \"accentColor\" } }. " +
    "The output of export-resume is also accepted.";

interface RequireDocumentResult {
    resumeId: string;
    document: ResumeDocument;
}

type EntryList = Array<{ id: string }>;

export const createResumeTools = (host: ResumeToolsHost): WebmcpToolDefinition[] => {
    const { store } = host;
    const actions = () => store.getState().actions;

    const ensureHydrated = async (): Promise<void> => {
        await actions().hydrate();
    };

    /** Resolve the target resume; `resumeId` falls back to the active resume. */
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
        return { resumeId, document };
    };

    const readDocument = (resumeId: string): ResumeDocument | undefined =>
        store.getState().documents[resumeId];

    const currentPath = () => host.getPath().replace(/\/+$/, "") || "/";

    const isOnDocument = (resumeId: string): boolean =>
        currentPath() === `/resume/${resumeId}` ||
        currentPath().startsWith(`/resume/${resumeId}/`);

    const currentPanel = (): EditorPanel =>
        parseEditorPanel(host.getSearch?.().panel);

    const locationName = (path: string) =>
        path === "/"
            ? "dashboard"
            : path.endsWith("/preview")
              ? "preview"
              : path.startsWith("/resume/")
                ? "editor"
                : "other";

    /** Open the editor for a resume on the given panel and make it active. */
    const openEditor = async (resumeId: string, panel: EditorPanel = "content") => {
        const onEditor = currentPath() === `/resume/${resumeId}`;
        if (!onEditor || currentPanel() !== panel) {
            await host.navigate(
                "/resume/$documentId",
                { documentId: resumeId },
                editorPanelSearch(panel)
            );
        }
        if (store.getState().activeDocumentId !== resumeId) {
            actions().selectDocument(resumeId);
        }
    };

    /**
     * When the user is watching this resume's editor, bring the step an agent
     * just edited into view.  Step changes are navigation, not undo entries.
     */
    const followStep = (resumeId: string, step: ResumeStep) => {
        const state = store.getState();
        const document = state.documents[resumeId];
        if (
            !document ||
            state.activeDocumentId !== resumeId ||
            currentPath() !== `/resume/${resumeId}` ||
            currentPanel() !== "content" ||
            state.currentStep === step
        ) {
            return;
        }
        const visible =
            step === "personal-info" ||
            document.sections.some((section) => section.id === step && section.visible);
        if (visible) actions().setCurrentStep(step);
    };

    /**
     * Content written to a section that is missing or hidden would never
     * appear on the resume, so writing to it also shows the section.
     */
    const ensureSectionShown = (
        resumeId: string,
        section: BuiltInSectionId
    ): "added" | "shown" | null => {
        const document = readDocument(resumeId);
        const layout = document?.sections.find((item) => item.id === section);
        if (!layout) {
            actions().addSection(section, resumeId);
            return "added";
        }
        if (!layout.visible) {
            actions().setSectionVisibility(section, true, resumeId);
            return "shown";
        }
        return null;
    };

    const sectionLayout = (document: ResumeDocument | undefined) =>
        document?.sections.map((item) => ({
            id: item.id,
            title: item.title,
            visible: item.visible,
        })) ?? [];

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

    const entryWarnings = (entry: Record<string, unknown>): string[] => {
        const urls: string[] = [];
        if (typeof entry.url === "string") urls.push(entry.url.trim());
        if (Array.isArray(entry.links)) {
            for (const link of entry.links) urls.push(String(asRecord(link).url ?? ""));
        }
        return linkWarnings(urls);
    };

    const entryList = (
        document: ResumeDocument,
        section: RepeatableSection
    ): EntryList => {
        const items = document[section] as EntryList | undefined;
        return Array.isArray(items) ? items : [];
    };

    const requireSection = (value: unknown) =>
        requireEnum<RepeatableSection>(value, REPEATABLE_SECTIONS, "section");

    /** Find an entry by id, listing the valid ids when it does not exist. */
    const requireEntry = (
        document: ResumeDocument,
        section: RepeatableSection,
        entryIdInput: unknown
    ): { entryId: string; index: number } => {
        const entryId =
            optionalString(entryIdInput) || fail<string>(`"entryId" must be a non-empty string.`);
        const items = entryList(document, section);
        const index = items.findIndex((item) => item.id === entryId);
        if (index < 0) {
            const ids = items.map((item) => item.id);
            fail(
                `No ${section} entry with id "${entryId}".` +
                    (ids.length
                        ? ` Existing ${section} entry ids: ${ids.join(", ")}.`
                        : ` This resume has no ${section} entries yet.`)
            );
        }
        return { entryId, index };
    };

    /** Resolve a toIndex / direction pair against a list length. */
    const resolveMoveTarget = (
        input: Record<string, unknown>,
        fromIndex: number,
        length: number,
        label: string
    ): number => {
        const hasIndex = input.toIndex !== undefined && input.toIndex !== null;
        const hasDirection = typeof input.direction === "string" && input.direction.trim() !== "";
        if (hasIndex === hasDirection) {
            fail(
                `Provide exactly one of "toIndex" (0 to ${length - 1}) or "direction" (${MOVE_DIRECTIONS.join(", ")}).`
            );
        }
        if (hasDirection) {
            const direction = requireEnum<MoveDirection>(input.direction, MOVE_DIRECTIONS, "direction");
            const target = {
                up: fromIndex - 1,
                down: fromIndex + 1,
                top: 0,
                bottom: length - 1,
            }[direction];
            return Math.min(length - 1, Math.max(0, target));
        }
        const toIndex = Number(input.toIndex);
        if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= length) {
            fail(`"toIndex" must be an integer from 0 to ${length - 1} for this ${label}.`);
        }
        return toIndex;
    };

    /** The headline links, or one project's links when projectId is given. */
    const resolveLinkOwner = (
        document: ResumeDocument,
        projectIdInput: unknown
    ): { projectId?: string; links: ResumeLink[]; label: string } => {
        const projectId = optionalString(projectIdInput);
        if (!projectId) {
            return { links: document.personalInfo.titleLinks, label: "headline links" };
        }
        const project = document.projects.find((entry) => entry.id === projectId);
        if (!project) {
            const ids = document.projects.map((entry) => entry.id);
            return fail(
                `No project with id "${projectId}".` +
                    (ids.length
                        ? ` Project ids: ${ids.join(", ")}.`
                        : " This resume has no projects; omit projectId to edit the headline links.")
            );
        }
        return { projectId, links: project.links, label: `links of project "${project.title || projectId}"` };
    };

    const requireLink = (
        owner: { links: ResumeLink[]; label: string },
        linkIdInput: unknown
    ): { linkId: string; index: number } => {
        const linkId =
            optionalString(linkIdInput) || fail<string>(`"linkId" must be a non-empty string.`);
        const index = owner.links.findIndex((link) => link.id === linkId);
        if (index < 0) {
            const ids = owner.links.map((link) => link.id);
            fail(
                `No link with id "${linkId}" in the ${owner.label}.` +
                    (ids.length ? ` Link ids: ${ids.join(", ")}.` : " There are no links yet.")
            );
        }
        return { linkId, index };
    };

    const readLinks = (resumeId: string, projectId?: string): ResumeLink[] => {
        const document = readDocument(resumeId);
        if (!document) return [];
        return projectId
            ? document.projects.find((entry) => entry.id === projectId)?.links ?? []
            : document.personalInfo.titleLinks;
    };

    const requireLayoutSection = (document: ResumeDocument, value: unknown) => {
        const section = requireEnum<BuiltInSectionId>(value, BUILT_IN_SECTION_IDS, "section");
        if (!document.sections.some((item) => item.id === section)) {
            fail(
                `Section "${section}" is not part of this resume's layout. Sections in the layout: ${document.sections
                    .map((item) => item.id)
                    .join(", ") || "none"}. Add it with set-section-visibility.`
            );
        }
        return section;
    };

    const historyState = () => {
        const { history } = store.getState();
        return { canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
    };

    /** Navigate to a freshly created resume's editor and describe it. */
    const openCreatedResume = async (resumeId: string) => {
        await openEditor(resumeId);
        const document = readDocument(resumeId);
        return {
            resumeId,
            name: document?.meta.name || "Untitled resume",
            editPath: `/resume/${resumeId}`,
            previewPath: `/resume/${resumeId}/preview`,
            currentStep: store.getState().currentStep,
        };
    };

    const definitions: WebmcpToolDefinition[] = [
        // --- Workspace and resumes -------------------------------------------------
        {
            name: "get-workspace",
            title: "Read workspace",
            description:
                "List every resume stored in this browser with its completion progress, " +
                "plus which resume is active and where the user currently is in the app " +
                "(dashboard, editor with its step and panel, or preview). Start here to discover resume ids.",
            inputSchema: { type: "object", properties: {} },
            annotations: { readOnlyHint: true },
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
                        template: document.settings.template,
                        createdAt: document.meta.createdAt,
                        updatedAt: document.meta.updatedAt,
                    };
                });
                const path = currentPath();
                const location = locationName(path);
                return jsonResult({
                    resumes,
                    activeResumeId: state.activeDocumentId,
                    currentStep: state.currentStep,
                    currentPath: path,
                    location,
                    ...(location === "editor" ? { editorPanel: currentPanel() } : {}),
                    ...historyState(),
                    hydration: state.persistence.hydration,
                    saveStatus: state.persistence.save,
                });
            },
        },
        {
            name: "get-resume",
            title: "Read resume",
            description:
                "Read the full content of one resume with every id needed by the editing tools: " +
                "personal info and headline links, summary, experience, education, projects " +
                "(with their links), skills, certifications, awards, languages, the section layout, " +
                "appearance settings, and the editor steps with their completion. Blank draft rows " +
                "are omitted unless includeDrafts is true.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    includeDrafts: {
                        type: "boolean",
                        description:
                            "Include blank rows the user added in the editor but has not filled in yet.",
                    },
                },
            },
            annotations: { readOnlyHint: true },
            async execute(input) {
                const { document } = await requireDocument(input.resumeId);
                const inLayout = new Set(document.sections.map((section) => section.id));
                return jsonResult({
                    resume: input.includeDrafts === true ? document : cleanResumeDocument(document),
                    completion: getCompletion(document),
                    editor: {
                        steps: getNavigation(document).items.map(({ id, title, completed }) => ({
                            id,
                            title,
                            completed,
                        })),
                        sectionsNotInLayout: BUILT_IN_SECTIONS.filter(
                            (section) => !inLayout.has(section.id)
                        ).map((section) => section.id),
                    },
                });
            },
        },
        {
            name: "create-resume",
            title: "Create resume",
            description:
                "Create a new empty resume, make it the active resume, and open it in the " +
                "step-by-step editor. Then fill it with update-personal-info, update-summary, " +
                "add-section-entry, and finally open-preview. To create a complete resume in one " +
                "call, use import-resume instead.",
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
                            "Optional initial template, one of: " +
                            `${RESUME_TEMPLATES_VALUES.join(", ")}. Defaults to the Tenali Modern template.`,
                    },
                    pageSize: {
                        type: "string",
                        description:
                            "Optional initial page size: A4 or Letter. Defaults to A4.",
                    },
                    sections: {
                        type: "array",
                        items: { type: "string" },
                        description:
                            "Optional initial sections in display order, from: " +
                            `${BUILT_IN_SECTION_IDS.join(", ")}. Defaults to experience, education, projects, skills.`,
                    },
                },
            },
            async execute(input) {
                await ensureHydrated();
                const name = optionalString(input.name) || "Untitled resume";
                const description = optionalString(input.description);
                const template = optionalString(input.template);
                if (template && !RESUME_TEMPLATES_VALUES.includes(template)) {
                    fail(
                        `Unknown template "${template}". Available templates: ${RESUME_TEMPLATES_VALUES.join(
                            ", "
                        )}.`
                    );
                }
                const pageSize = optionalString(input.pageSize);
                if (pageSize && !PAGE_SIZES.includes(pageSize as "A4" | "Letter")) {
                    fail(`"pageSize" must be one of: ${PAGE_SIZES.join(", ")}.`);
                }
                let sections: BuiltInSectionId[] | undefined;
                if (input.sections !== undefined) {
                    const list: unknown[] = Array.isArray(input.sections)
                        ? input.sections
                        : fail(`"sections" must be an array of section ids.`);
                    sections = list.map((section) =>
                        requireEnum<BuiltInSectionId>(section, BUILT_IN_SECTION_IDS, "sections[]")
                    );
                }
                const documentId = actions().createDocument({
                    name,
                    ...(description ? { description } : {}),
                    ...(template ? { template } : {}),
                    ...(pageSize ? { pageSize: pageSize as "A4" | "Letter" } : {}),
                    ...(sections ? { sections } : {}),
                });
                if (!documentId) fail("The resume could not be created.");
                return jsonResult(await openCreatedResume(documentId));
            },
        },
        {
            name: "create-sample-resume",
            title: "Create sample resume",
            description:
                "Create a fully filled sample resume (a product designer) and open it in the editor. " +
                "Useful for showing the user what a finished resume looks like, or as a starting point to edit.",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                await ensureHydrated();
                const resumeId =
                    actions().importDocument(createSampleResumePayload(), { select: true }) ??
                    fail<string>("The sample resume could not be created.");
                return jsonResult(await openCreatedResume(resumeId));
            },
        },
        {
            name: "import-resume",
            title: "Import resume",
            description:
                "Create a new resume from a complete JSON document in one call and open it in the editor. " +
                "This is the fastest way to build a whole resume. " +
                RESUME_JSON_HINT,
            inputSchema: {
                type: "object",
                properties: {
                    resume: {
                        type: "object",
                        description: `The resume document. ${RESUME_JSON_HINT}`,
                    },
                    json: {
                        type: "string",
                        description: "The same document as a JSON string, instead of resume.",
                    },
                },
            },
            async execute(input) {
                await ensureHydrated();
                let payload: unknown = input.resume;
                if (payload === undefined && typeof input.json === "string") {
                    try {
                        payload = JSON.parse(input.json);
                    } catch {
                        fail(`"json" is not valid JSON.`);
                    }
                }
                const record = asRecord(payload);
                if (Object.keys(record).length === 0) {
                    fail(`Provide the resume document as "resume" (object) or "json" (string). ${RESUME_JSON_HINT}`);
                }
                // A bare document only needs meta or personalInfo to be
                // recognised; give agent-authored objects that marker.
                const recognised =
                    record.kind === "resume-document" ||
                    record.meta || record.metadata || record.personalInfo || record.personal_info;
                const document = recognised
                    ? record
                    : { ...record, meta: { name: optionalString(record.name) ?? "" } };
                const resumeId =
                    actions().importDocument(document, { select: true }) ??
                    fail<string>(`That document is not a supported resume. ${RESUME_JSON_HINT}`);
                const imported = readDocument(resumeId);
                return jsonResult({
                    ...(await openCreatedResume(resumeId)),
                    completion: imported ? getCompletion(imported) : undefined,
                    sections: sectionLayout(imported),
                });
            },
        },
        {
            name: "duplicate-resume",
            title: "Duplicate resume",
            description:
                "Copy a resume (content, layout, and appearance) into a new resume named \"<name> Copy\", " +
                "make the copy active, and open it in the editor. Use this to tailor a base resume for a " +
                "specific job without changing the original.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    name: {
                        type: "string",
                        description: "Optional name for the copy, e.g. \"Backend Engineer, Acme\".",
                    },
                },
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const copyId =
                    actions().duplicateDocument(resumeId) ??
                    fail<string>(`The resume "${resumeId}" could not be duplicated.`);
                const name = optionalString(input.name);
                if (name) actions().updateDocument({ meta: { name } }, copyId);
                return jsonResult({ sourceResumeId: resumeId, ...(await openCreatedResume(copyId)) });
            },
        },
        {
            name: "update-resume-details",
            title: "Rename resume",
            description:
                "Change a resume's display name (shown in the editor toolbar and dashboard) and its " +
                "dashboard note. These are for organising drafts; the person's name on the page is set " +
                "with update-personal-info.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    name: { type: "string", description: "New display name." },
                    description: {
                        type: "string",
                        description: "New dashboard note. Pass an empty string to clear it.",
                    },
                },
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const name = nonEmptyString(input, "name", "resume name");
                const description = optionalString(input.description);
                if (name === undefined && description === undefined) {
                    fail("Provide at least one of: name, description.");
                }
                actions().updateDocument(
                    {
                        meta: {
                            ...(name !== undefined ? { name } : {}),
                            ...(description !== undefined ? { description } : {}),
                        },
                    },
                    resumeId
                );
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    name: fresh?.meta.name,
                    description: fresh?.meta.description,
                });
            },
        },
        {
            name: "delete-resume",
            title: "Delete resume",
            description:
                "Delete a resume from this browser. If it was open the app returns to the " +
                "dashboard. The user can restore it with undo while the page stays open.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: {
                        type: "string",
                        description: "Id of the resume to delete.",
                    },
                },
                required: ["resumeId"],
            },
            annotations: { consequentialHint: true },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const wasActive = store.getState().activeDocumentId === resumeId;
                const wasOpen = isOnDocument(resumeId);
                actions().deleteDocument(resumeId);
                if (wasActive || wasOpen) {
                    await host.navigate("/");
                }
                return jsonResult({
                    deletedResumeId: resumeId,
                    remainingResumes: Object.keys(store.getState().documents).length,
                });
            },
        },

        // --- Navigation ------------------------------------------------------------
        {
            name: "set-builder-step",
            title: "Open editor step",
            description:
                "Open the editor on a specific step (personal info, summary, experience, ...) so the " +
                "user sees that part of the resume. The step must be a section shown on the " +
                "resume; show hidden sections with set-section-visibility first.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
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
                    const shown = document.sections
                        .filter((section) => section.visible)
                        .map((section) => section.id)
                        .join(", ");
                    return fail(
                        stepSection
                            ? `Section "${step}" exists but is hidden on this resume. Show it with set-section-visibility first, or choose one of: personal-info, ${shown}.`
                            : `Section "${step}" is not enabled on this resume. Enable it with set-section-visibility first, or choose one of: personal-info, ${shown}.`
                    );
                }
                await openEditor(resumeId, "content");
                actions().setCurrentStep(step);
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
            name: "open-editor-panel",
            title: "Open editor panel",
            description:
                "Switch the editor between its panels: \"content\" (the step-by-step section editor), " +
                "\"sections\" (choose, rename, reorder, and hide sections), or \"appearance\" (template " +
                "gallery, page size, fonts, accent color). Opens the editor if needed. Use this to show " +
                "the user the controls matching what you are changing.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    panel: {
                        type: "string",
                        description: `Panel to open, one of: ${EDITOR_PANELS.join(", ")}.`,
                    },
                },
                required: ["panel"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const panel = requireEnum<EditorPanel>(input.panel, EDITOR_PANELS, "panel");
                await openEditor(resumeId, panel);
                return jsonResult({
                    resumeId,
                    panel,
                    editPath: `/resume/${resumeId}${panel === "content" ? "" : `?panel=${panel}`}`,
                });
            },
        },
        {
            name: "open-preview",
            title: "Open preview",
            description:
                "Open the full-page resume preview, where the template, page size, fonts, and " +
                "accent color can be changed. Use export-pdf when the user wants to save the " +
                "resume as a PDF.",
            inputSchema: RESUME_ID_PROPERTY,
            annotations: { readOnlyHint: true },
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
            name: "go-to-dashboard",
            title: "Go to dashboard",
            description:
                "Navigate back to the resume dashboard (the list of all saved resumes).",
            inputSchema: { type: "object", properties: {} },
            annotations: { readOnlyHint: true },
            async execute() {
                await host.navigate("/");
                return jsonResult({ currentPath: "/" });
            },
        },

        // --- History ---------------------------------------------------------------
        {
            name: "undo",
            title: "Undo",
            description:
                "Undo the most recent change in the workspace, whether it was made by the user or by " +
                "an agent (the same as the editor's Undo button). Batch tool calls undo as one change.",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                await ensureHydrated();
                if (!historyState().canUndo) fail("There is nothing to undo.");
                actions().undo();
                return jsonResult({ undone: true, activeResumeId: store.getState().activeDocumentId, ...historyState() });
            },
        },
        {
            name: "redo",
            title: "Redo",
            description: "Redo the change most recently undone (the same as the editor's Redo button).",
            inputSchema: { type: "object", properties: {} },
            async execute() {
                await ensureHydrated();
                if (!historyState().canRedo) fail("There is nothing to redo.");
                actions().redo();
                return jsonResult({ redone: true, activeResumeId: store.getState().activeDocumentId, ...historyState() });
            },
        },

        // --- Personal info, summary, awards -----------------------------------------
        {
            name: "update-personal-info",
            title: "Update personal info",
            description:
                "Set the resume owner's contact details: full name, email, phone, photo, and " +
                "headline links (LinkedIn, GitHub, portfolio...). Only provided fields change. " +
                "Providing links replaces the whole link list; use add-link, update-link, delete-link, " +
                "and move-link to change one link.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    name: { type: "string", description: "Full name, e.g. \"Vyshnav Reddy\"." },
                    email: { type: "string", description: "Contact email address." },
                    phone: { type: "string", description: "Contact phone number." },
                    image: {
                        type: "string",
                        description:
                            "Photo shown by portrait templates (oslo, vienna, kyoto, geneva, austin, zurich, sydney, berlin): " +
                            "an https:// image URL or a data:image/png|jpeg|webp;base64 URL under 1.4 MB. " +
                            "Pass an empty string to remove the photo.",
                    },
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
                const image = optionalString(input.image);
                if (image !== undefined) {
                    if (image && !isPortraitImageValue(image)) {
                        fail(
                            `"image" must be an https:// image URL or a data:image/png, jpeg, or webp base64 URL under 1.4 MB. Pass "" to remove the photo.`
                        );
                    }
                    patch.image = image || undefined;
                }
                let warnings: string[] = [];
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
                    warnings = linkWarnings(patch.titleLinks.map((link) => link.url));
                }
                if (Object.keys(patch).length === 0) {
                    fail(
                        "Provide at least one of: name, email, phone, image, links."
                    );
                }
                actions().updateDocument({ personalInfo: patch }, resumeId);
                followStep(resumeId, "personal-info");
                const fresh = readDocument(resumeId);
                const { image: storedImage, ...personalInfo } = fresh?.personalInfo ?? { titleLinks: [] };
                return jsonResult({
                    resumeId,
                    // A data URL photo can be very large; report only whether one is set.
                    personalInfo: { ...personalInfo, hasImage: Boolean(storedImage) },
                    ...(warnings.length ? { warnings } : {}),
                });
            },
        },
        {
            name: "update-summary",
            title: "Write summary",
            description:
                "Set the professional summary shown at the top of the resume. Write 2-4 " +
                "sentences describing the person's role, years of experience, and strengths. " +
                "Accepts plain text or simple HTML (<p>, <ul>/<li>, <strong>, <em>, <a>). " +
                "Pass an empty string to clear it. Writing a summary also shows the summary section.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    summary: { type: "string", description: "The summary text (HTML allowed)." },
                },
                required: ["summary"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                if (typeof input.summary !== "string") {
                    return fail(`"summary" must be a string.`);
                }
                const summary = input.summary;
                const sectionChange = actions().batch(() => {
                    actions().updateDocument({ summary }, resumeId);
                    return summary.trim() ? ensureSectionShown(resumeId, "summary") : null;
                });
                followStep(resumeId, "summary");
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    summary: fresh?.summary ?? summary,
                    ...(sectionChange ? { section: sectionChange } : {}),
                });
            },
        },
        {
            name: "update-awards",
            title: "Write awards",
            description:
                "Set the awards and recognitions section content. Accepts plain text or simple " +
                "HTML (<p>, <ul>/<li>, <strong>, <em>, <a>). Pass an empty string to clear it. " +
                "Writing awards also shows the awards section.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    awards: { type: "string", description: "The awards content (HTML allowed)." },
                },
                required: ["awards"],
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                if (typeof input.awards !== "string") {
                    return fail(`"awards" must be a string.`);
                }
                const awards = input.awards;
                const sectionChange = actions().batch(() => {
                    actions().updateDocument({ awards }, resumeId);
                    return awards.trim() ? ensureSectionShown(resumeId, "awards") : null;
                });
                followStep(resumeId, "awards");
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    awards: fresh?.awards ?? awards,
                    ...(sectionChange ? { section: sectionChange } : {}),
                });
            },
        },

        // --- Section entries -------------------------------------------------------
        {
            name: "add-section-entry",
            title: "Add entry",
            description:
                "Add one entry (entry) or several entries at once (entries) to a repeatable resume " +
                "section and return their entryIds. Adding to a section that is hidden or not in the " +
                "layout also shows it. A batch undoes as one change. " +
                ENTRY_FIELD_HINTS,
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    section: SECTION_ENTRY_PROPERTIES.section,
                    entry: {
                        type: "object",
                        description: `Fields for one new entry. ${ENTRY_FIELD_HINTS}`,
                    },
                    entries: {
                        type: "array",
                        items: { type: "object" },
                        description:
                            "Several new entries, added in order. Use instead of entry, e.g. a whole skills list.",
                    },
                    position: {
                        type: "integer",
                        description:
                            "Optional zero-based position for the new entry (or the first of entries). Defaults to the end.",
                    },
                },
                required: ["section"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireSection(input.section);
                const required = SECTION_ENTRY_FIELDS[section].required.join(", ");
                let rawEntries: unknown[];
                if (input.entries !== undefined) {
                    if (input.entry !== undefined) fail(`Provide "entry" or "entries", not both.`);
                    rawEntries = Array.isArray(input.entries) && input.entries.length > 0
                        ? input.entries
                        : fail(`"entries" must be a non-empty array of ${section} entries.`);
                } else {
                    rawEntries = [input.entry];
                }
                const entries = rawEntries.map((raw, index) => {
                    const record = asRecord(raw);
                    const where = rawEntries.length > 1 ? `entries[${index}]: ` : "";
                    if (Object.keys(record).length === 0) {
                        fail(
                            `${where}"entry" must be an object with the fields of a ${section} entry. Required: ${required}. ${ENTRY_FIELD_HINTS}`
                        );
                    }
                    try {
                        return normalizeSectionEntry(section, record, { requireAll: true });
                    } catch (error) {
                        throw new ToolInputError(`${where}${(error as Error).message}`);
                    }
                });
                const position = input.position;
                const startIndex = entryList(document, section).length;
                if (
                    position !== undefined &&
                    (!Number.isInteger(position) || Number(position) < 0 || Number(position) > startIndex)
                ) {
                    fail(`"position" must be an integer from 0 to ${startIndex}.`);
                }
                const { entryIds, sectionChange } = actions().batch(() => {
                    const ids = entries.map((entry) =>
                        actions().createEntry(section, entry as RepeatableEntryInput, resumeId)
                    );
                    if (position !== undefined && Number(position) !== startIndex) {
                        ids.forEach((_, offset) =>
                            actions().reorderEntries(section, startIndex + offset, Number(position) + offset, resumeId)
                        );
                    }
                    return { entryIds: ids, sectionChange: ensureSectionShown(resumeId, section) };
                });
                if (entryIds.some((id) => !id)) {
                    return fail(
                        `The ${section} entry could not be added. Make sure the resume "${resumeId}" still exists.`
                    );
                }
                followStep(resumeId, section);
                const fresh = readDocument(resumeId);
                const created = entryIds.map((id) =>
                    fresh ? entryList(fresh, section).find((item) => item.id === id) : undefined
                );
                const warnings = entries.flatMap(entryWarnings);
                return jsonResult({
                    resumeId,
                    section,
                    ...(entryIds.length === 1
                        ? { entryId: entryIds[0], entry: created[0] }
                        : { entryIds, entries: created }),
                    ...(sectionChange ? { sectionVisibility: sectionChange } : {}),
                    ...(warnings.length ? { warnings } : {}),
                });
            },
        },
        {
            name: "update-section-entry",
            title: "Edit entry",
            description:
                "Update fields of an existing entry in a repeatable section. Only provided " +
                `fields change. ${ENTRY_FIELD_HINTS} For projects, links replaces the project's link list. ` +
                "Use get-resume to find entryIds.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...SECTION_ENTRY_PROPERTIES,
                    patch: {
                        type: "object",
                        description: `Fields to change. ${ENTRY_FIELD_HINTS}`,
                    },
                },
                required: ["section", "entryId", "patch"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireSection(input.section);
                const { entryId } = requireEntry(document, section, input.entryId);
                const patchInput = asRecord(input.patch);
                if (Object.keys(patchInput).length === 0) {
                    return fail(`"patch" must contain at least one field to change.`);
                }
                const patch = normalizeSectionEntry(section, patchInput, {
                    requireAll: false,
                });
                actions().updateEntry(section, entryId, patch, resumeId);
                followStep(resumeId, section);
                const fresh = readDocument(resumeId);
                const updated = fresh
                    ? entryList(fresh, section).find((item) => item.id === entryId)
                    : undefined;
                const warnings = entryWarnings(patch);
                return jsonResult({
                    resumeId,
                    section,
                    entryId,
                    entry: updated,
                    ...(warnings.length ? { warnings } : {}),
                });
            },
        },
        {
            name: "delete-section-entry",
            title: "Delete entry",
            description:
                "Delete one entry from a repeatable resume section (experience, education, " +
                "projects, skills, certifications, or languages).",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...SECTION_ENTRY_PROPERTIES,
                },
                required: ["section", "entryId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireSection(input.section);
                const { entryId } = requireEntry(document, section, input.entryId);
                actions().deleteEntry(section, entryId, resumeId);
                followStep(resumeId, section);
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
            name: "move-section-entry",
            title: "Move entry",
            description:
                "Change the order of an entry within its section, e.g. put the most relevant job first. " +
                "Give toIndex (zero-based) or direction (up, down, top, bottom).",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...SECTION_ENTRY_PROPERTIES,
                    ...MOVE_PROPERTIES,
                },
                required: ["section", "entryId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireSection(input.section);
                const { entryId, index } = requireEntry(document, section, input.entryId);
                const length = entryList(document, section).length;
                const toIndex = resolveMoveTarget(input, index, length, `${section} list`);
                actions().reorderEntries(section, index, toIndex, resumeId);
                followStep(resumeId, section);
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    section,
                    entryId,
                    index: toIndex,
                    order: fresh ? entryList(fresh, section).map((item) => item.id) : [],
                });
            },
        },
        {
            name: "duplicate-section-entry",
            title: "Duplicate entry",
            description:
                "Copy an entry and insert the copy right after it. Returns the new entryId, ready to edit " +
                "with update-section-entry.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...SECTION_ENTRY_PROPERTIES,
                },
                required: ["section", "entryId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireSection(input.section);
                const { entryId } = requireEntry(document, section, input.entryId);
                const copyId =
                    actions().duplicateEntry(section, entryId, resumeId) ??
                    fail<string>(`The ${section} entry could not be duplicated.`);
                followStep(resumeId, section);
                const fresh = readDocument(resumeId);
                return jsonResult({
                    resumeId,
                    section,
                    sourceEntryId: entryId,
                    entryId: copyId,
                    entry: fresh ? entryList(fresh, section).find((item) => item.id === copyId) : undefined,
                });
            },
        },

        // --- Links (headline links and project links) --------------------------------
        {
            name: "add-link",
            title: "Add link",
            description:
                "Add one link to the headline links under the person's name, or to a project when " +
                "projectId is given. Returns the new linkId.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...LINK_OWNER_PROPERTY,
                    title: { type: "string", description: "Link text, e.g. \"GitHub\"." },
                    url: { type: "string", description: "Full URL, e.g. \"https://github.com/...\"." },
                    position: {
                        type: "integer",
                        description: "Optional zero-based position. Defaults to the end.",
                    },
                },
                required: ["url"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const owner = resolveLinkOwner(document, input.projectId);
                const url = nonEmptyString(input, "url", "link URL") ?? fail<string>(`"url" is required.`);
                const title = optionalString(input.title) ?? "";
                const startIndex = owner.links.length;
                const position = input.position;
                if (
                    position !== undefined &&
                    (!Number.isInteger(position) || Number(position) < 0 || Number(position) > startIndex)
                ) {
                    fail(`"position" must be an integer from 0 to ${startIndex}.`);
                }
                const linkId = actions().batch(() => {
                    const id = owner.projectId
                        ? actions().createProjectLink(owner.projectId, { title, url }, resumeId)
                        : actions().createLink({ title, url }, resumeId);
                    if (id && position !== undefined && Number(position) !== startIndex) {
                        if (owner.projectId) {
                            actions().reorderProjectLinks(owner.projectId, startIndex, Number(position), resumeId);
                        } else {
                            actions().reorderLinks(startIndex, Number(position), resumeId);
                        }
                    }
                    return id;
                }) ?? fail<string>("The link could not be added.");
                followStep(resumeId, owner.projectId ? "projects" : "personal-info");
                const warnings = linkWarnings([url]);
                return jsonResult({
                    resumeId,
                    ...(owner.projectId ? { projectId: owner.projectId } : {}),
                    linkId,
                    links: readLinks(resumeId, owner.projectId),
                    ...(warnings.length ? { warnings } : {}),
                });
            },
        },
        {
            name: "update-link",
            title: "Edit link",
            description:
                "Change the title or URL of one headline link, or of a project link when projectId is given.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...LINK_OWNER_PROPERTY,
                    linkId: { type: "string", description: "Id of the link (from get-resume or add-link)." },
                    title: { type: "string", description: "New link text." },
                    url: { type: "string", description: "New full URL." },
                },
                required: ["linkId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const owner = resolveLinkOwner(document, input.projectId);
                const { linkId } = requireLink(owner, input.linkId);
                const title = optionalString(input.title);
                const url = nonEmptyString(input, "url", "link URL");
                if (title === undefined && url === undefined) fail("Provide at least one of: title, url.");
                const patch = {
                    ...(title !== undefined ? { title } : {}),
                    ...(url !== undefined ? { url } : {}),
                };
                if (owner.projectId) {
                    actions().updateProjectLink(owner.projectId, linkId, patch, resumeId);
                } else {
                    actions().updateLink(linkId, patch, resumeId);
                }
                followStep(resumeId, owner.projectId ? "projects" : "personal-info");
                const warnings = url ? linkWarnings([url]) : [];
                return jsonResult({
                    resumeId,
                    ...(owner.projectId ? { projectId: owner.projectId } : {}),
                    link: readLinks(resumeId, owner.projectId).find((link) => link.id === linkId),
                    ...(warnings.length ? { warnings } : {}),
                });
            },
        },
        {
            name: "delete-link",
            title: "Delete link",
            description: "Remove one headline link, or one project link when projectId is given.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...LINK_OWNER_PROPERTY,
                    linkId: { type: "string", description: "Id of the link to remove." },
                },
                required: ["linkId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const owner = resolveLinkOwner(document, input.projectId);
                const { linkId } = requireLink(owner, input.linkId);
                if (owner.projectId) {
                    actions().deleteProjectLink(owner.projectId, linkId, resumeId);
                } else {
                    actions().deleteLink(linkId, resumeId);
                }
                followStep(resumeId, owner.projectId ? "projects" : "personal-info");
                return jsonResult({
                    resumeId,
                    ...(owner.projectId ? { projectId: owner.projectId } : {}),
                    deletedLinkId: linkId,
                    links: readLinks(resumeId, owner.projectId),
                });
            },
        },
        {
            name: "move-link",
            title: "Move link",
            description:
                "Reorder one headline link, or one project link when projectId is given. Give toIndex " +
                "(zero-based) or direction (up, down, top, bottom).",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    ...LINK_OWNER_PROPERTY,
                    linkId: { type: "string", description: "Id of the link to move." },
                    ...MOVE_PROPERTIES,
                },
                required: ["linkId"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const owner = resolveLinkOwner(document, input.projectId);
                const { linkId, index } = requireLink(owner, input.linkId);
                const toIndex = resolveMoveTarget(input, index, owner.links.length, "link list");
                if (owner.projectId) {
                    actions().reorderProjectLinks(owner.projectId, index, toIndex, resumeId);
                } else {
                    actions().reorderLinks(index, toIndex, resumeId);
                }
                followStep(resumeId, owner.projectId ? "projects" : "personal-info");
                return jsonResult({
                    resumeId,
                    ...(owner.projectId ? { projectId: owner.projectId } : {}),
                    linkId,
                    index: toIndex,
                    order: readLinks(resumeId, owner.projectId).map((link) => link.id),
                });
            },
        },

        // --- Section layout ---------------------------------------------------------
        {
            name: "set-section-visibility",
            title: "Show or hide section",
            description:
                "Show or hide a resume section (summary, experience, education, projects, " +
                "skills, certifications, awards, languages). Hidden sections keep their content. " +
                "Enabling a section that is not in the layout adds it to the end of the editor steps.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
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
                    actions().addSection(section, resumeId);
                } else if (present) {
                    actions().setSectionVisibility(section, input.enabled === true, resumeId);
                }
                return jsonResult({
                    resumeId,
                    section,
                    enabled: input.enabled,
                    sections: sectionLayout(readDocument(resumeId)),
                });
            },
        },
        {
            name: "rename-section",
            title: "Rename section",
            description:
                "Change the heading a section shows on the resume and in the editor, e.g. rename " +
                "\"Experience\" to \"Work history\". The section id stays the same.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    section: {
                        type: "string",
                        description: `Section id, one of: ${BUILT_IN_SECTION_IDS.join(", ")}.`,
                    },
                    title: { type: "string", description: "New heading text." },
                },
                required: ["section", "title"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireLayoutSection(document, input.section);
                const title = nonEmptyString(input, "title", "section heading") ?? fail<string>(`"title" is required.`);
                actions().renameSection(section, title, resumeId);
                return jsonResult({ resumeId, section, title, sections: sectionLayout(readDocument(resumeId)) });
            },
        },
        {
            name: "reorder-sections",
            title: "Reorder sections",
            description:
                "Set the order sections appear in on the resume and in the editor steps. List section ids " +
                "in the desired order; sections you leave out keep their relative order after the listed ones. " +
                "Personal info is always first and is not listed.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    order: {
                        type: "array",
                        items: { type: "string" },
                        description: "Section ids in the new order, e.g. [\"summary\", \"skills\", \"experience\"].",
                    },
                },
                required: ["order"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const order: unknown[] = Array.isArray(input.order) && input.order.length > 0
                    ? input.order
                    : fail(`"order" must be a non-empty array of section ids.`);
                const ids = order.map((value) => requireLayoutSection(document, value));
                actions().setSectionOrder(ids, resumeId);
                return jsonResult({ resumeId, sections: sectionLayout(readDocument(resumeId)) });
            },
        },
        {
            name: "remove-section",
            title: "Remove section",
            description:
                "Take a section out of the resume layout and the editor steps. Its content is kept, so " +
                "set-section-visibility with enabled true brings it back. To keep the step but hide it " +
                "from the page, use set-section-visibility with enabled false instead.",
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    section: {
                        type: "string",
                        description: `Section id, one of: ${BUILT_IN_SECTION_IDS.join(", ")}.`,
                    },
                },
                required: ["section"],
            },
            async execute(input) {
                const { resumeId, document } = await requireDocument(input.resumeId);
                const section = requireLayoutSection(document, input.section);
                actions().removeSection(section, resumeId);
                return jsonResult({ resumeId, removedSection: section, sections: sectionLayout(readDocument(resumeId)) });
            },
        },

        // --- Appearance ------------------------------------------------------------
        {
            name: "set-appearance",
            title: "Change appearance",
            description:
                "Change the resume's appearance settings: template, page size, title/body " +
                `font, and accent color. Templates: ${RESUME_TEMPLATES.map(
                    (template) =>
                        `${template.value} (${template.label}${template.layout === "single-column" ? "" : ", sidebar"}${template.portrait ? ", shows photo" : ""})`
                ).join(", ")}. Common fonts: ${COMMON_FONTS.join(", ")}.`,
            inputSchema: {
                type: "object",
                properties: {
                    resumeId: RESUME_ID_SCHEMA,
                    template: {
                        type: "string",
                        description:
                            "One of the built-in template ids: " +
                            `${RESUME_TEMPLATES_VALUES.join(", ")}.`,
                    },
                    pageSize: {
                        type: "string",
                        description: "Printed page size: A4 or Letter.",
                    },
                    titleFont: { type: "string", description: "Font used for headings." },
                    bodyFont: { type: "string", description: "Font used for body text." },
                    accentColor: {
                        type: "string",
                        description: 'Hex color like "#004aad", used for headings and links.',
                    },
                },
            },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                const patch: Record<string, string> = {};
                const template = optionalString(input.template);
                if (template !== undefined) {
                    if (!RESUME_TEMPLATES_VALUES.includes(template)) {
                        fail(
                            `Unknown template "${template}". Available templates: ${RESUME_TEMPLATES_VALUES.join(
                                ", "
                            )}.`
                        );
                    }
                    patch.template = template;
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
                actions().updateDocumentSettings(patch, resumeId);
                const fresh = readDocument(resumeId);
                return jsonResult({ resumeId, settings: fresh?.settings ?? patch });
            },
        },

        // --- Export ----------------------------------------------------------------
        {
            name: "export-pdf",
            title: "Export PDF",
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
            name: "export-resume",
            title: "Export JSON",
            description:
                "Export one resume as portable JSON (the same format used by the app's JSON " +
                "download and import). Waits for pending autosave so the export matches what " +
                "is stored. Returns the JSON document as text.",
            inputSchema: RESUME_ID_PROPERTY,
            annotations: { readOnlyHint: true },
            async execute(input) {
                const { resumeId } = await requireDocument(input.resumeId);
                await actions().flushSave();
                const payload = actions().exportDocument(resumeId);
                if (!payload) {
                    return fail(`No resume found with id "${resumeId}".`);
                }
                return { content: [{ type: "text", text: payload }] };
            },
        },
        {
            name: "get-live-session",
            title: "Read live session",
            description:
                "Report the live session this page is part of, if any. A live session shares one " +
                "resume between this browser and another on the same computer (for example an " +
                "agent's headless browser and the user's own browser) through a local relay started " +
                "with `node scripts/live-relay.mjs --resume <id>`. Edits from either side appear in " +
                "both, so call get-resume to see the user's latest changes. Returns the status " +
                "(off, connecting, waiting, live, reconnecting, blocked, ended) and where each other " +
                "participant is (view and step).",
            inputSchema: { type: "object", properties: {} },
            annotations: { readOnlyHint: true },
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
