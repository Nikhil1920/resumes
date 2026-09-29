/**
 * The resume workspace domain model.
 *
 * This file is deliberately free of React, Zustand, and browser APIs.  The
 * reducer and normalisers are useful in a browser, an SSR process, and in
 * tests in exactly the same way.
 */

import {
    defaultRichTextSanitizer,
    type RichTextSanitizer,
} from "./rich-text";

export const WORKSPACE_SCHEMA_VERSION = 1 as const;

export const BUILT_IN_SECTION_IDS = [
    "summary",
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "awards",
    "languages",
] as const;

export type BuiltInSectionId = (typeof BUILT_IN_SECTION_IDS)[number];
export type ResumeStep = "personal-info" | BuiltInSectionId;
export type PageSize = "A4" | "Letter";
export type LanguageProficiency =
    | "Basic"
    | "Conversational"
    | "Proficient"
    | "Fluent";

export interface ResumeLink {
    id: string;
    title: string;
    url: string;
}

export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    /** Optional headshot: a safe image data URL or https URL, rendered by portrait-capable templates. */
    image?: string;
    titleLinks: ResumeLink[];
}

export interface ExperienceEntry {
    id: string;
    company: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface EducationEntry {
    id: string;
    institution: string;
    location: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface ProjectEntry {
    id: string;
    title: string;
    description: string;
    skills: string[];
    startDate: string;
    endDate: string;
    links: ResumeLink[];
}

export interface SkillEntry {
    id: string;
    name: string;
    category: string;
}

export interface CertificationEntry {
    id: string;
    name: string;
    issuer: string;
    date: string;
    url: string;
}

export interface LanguageEntry {
    id: string;
    name: string;
    proficiency: LanguageProficiency;
}

/** A layout item is intentionally separate from resume content. */
export interface SectionLayout {
    id: BuiltInSectionId;
    title: string;
    description: string;
    visible: boolean;
}

export interface ResumeMetadata {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    step: ResumeStep;
}

export interface ResumeSettings {
    pageSize: PageSize;
    template: string;
    titleFont: string;
    bodyFont: string;
    accentColor: string;
}

/**
 * The one canonical editable document.  There are no UI draft mirrors of
 * these fields; callers edit by dispatching workspace actions.
 */
export interface ResumeDocument {
    schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
    meta: ResumeMetadata;
    sections: SectionLayout[];
    settings: ResumeSettings;
    personalInfo: PersonalInfo;
    summary: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    projects: ProjectEntry[];
    skills: SkillEntry[];
    certifications: CertificationEntry[];
    /** Awards were a rich-text field in the original Svelte application. */
    awards: string;
    languages: LanguageEntry[];
}

export interface WorkspaceSettings {
    autosave: boolean;
    autosaveDebounceMs: number;
}

export interface WorkspaceSnapshot {
    documents: Record<string, ResumeDocument>;
    activeDocumentId: string | null;
    currentStep: ResumeStep;
    settings: WorkspaceSettings;
}

export type HydrationStatus = "idle" | "hydrating" | "hydrated" | "error";
export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface PersistenceState {
    hydration: HydrationStatus;
    save: SaveStatus;
    lastSavedAt: string | null;
    error: string | null;
}

export interface IdFactory {
    (prefix: string): string;
}

export interface NormalizationOptions {
    idFactory?: IdFactory;
    now?: () => string;
    sanitizer?: RichTextSanitizer;
    /** Keep an empty editor row while a user is entering a new item. */
    preserveEmptyEntries?: boolean;
}

export interface WorkspaceReducerDependencies extends NormalizationOptions {
    idFactory: IdFactory;
    now: () => string;
}

export interface CreateDocumentInput {
    id?: string;
    name?: string;
    description?: string;
    template?: string;
    pageSize?: PageSize;
    sections?: BuiltInSectionId[] | SectionLayout[];
}

export type DocumentPatch = Partial<Omit<ResumeDocument, "schemaVersion" | "meta" | "sections" | "settings" | "personalInfo">> & {
    meta?: Partial<ResumeMetadata>;
    sections?: SectionLayout[];
    settings?: Partial<ResumeSettings>;
    personalInfo?: Partial<PersonalInfo>;
};

export type RepeatableSection =
    | "experience"
    | "education"
    | "projects"
    | "skills"
    | "certifications"
    | "languages";

export type RepeatableEntry =
    | ExperienceEntry
    | EducationEntry
    | ProjectEntry
    | SkillEntry
    | CertificationEntry
    | LanguageEntry;

export type RepeatableEntryInput =
    | Partial<ExperienceEntry>
    | Partial<EducationEntry>
    | Partial<ProjectEntry>
    | Partial<SkillEntry>
    | Partial<CertificationEntry>
    | Partial<LanguageEntry>;

export type ResumeLinkInput = Partial<ResumeLink>;

export type WorkspaceCommand =
    | { type: "document/create"; document?: CreateDocumentInput }
    | { type: "document/select"; documentId: string | null }
    | { type: "document/update"; documentId?: string; patch: DocumentPatch }
    | { type: "document/delete"; documentId: string }
    | { type: "document/duplicate"; documentId: string; newId?: string }
    | { type: "section/add"; sectionId: BuiltInSectionId }
    | { type: "section/remove"; sectionId: BuiltInSectionId }
    | {
          type: "section/rename";
          sectionId: BuiltInSectionId;
          title: string;
      }
    | {
          type: "section/reorder";
          fromIndex: number;
          toIndex: number;
      }
    | {
          type: "entry/create";
          section: RepeatableSection;
          entry?: RepeatableEntryInput;
      }
    | {
          type: "entry/update";
          section: RepeatableSection;
          entryId: string;
          patch: Record<string, unknown>;
      }
    | {
          type: "entry/delete";
          section: RepeatableSection;
          entryId: string;
      }
    | {
          type: "entry/duplicate";
          section: RepeatableSection;
          entryId: string;
      }
    | {
          type: "entry/reorder";
          section: RepeatableSection;
          fromIndex: number;
          toIndex: number;
      }
    | { type: "personal-link/create"; link?: ResumeLinkInput }
    | {
          type: "personal-link/update";
          linkId: string;
          patch: ResumeLinkInput;
      }
    | { type: "personal-link/delete"; linkId: string }
    | {
          type: "personal-link/reorder";
          fromIndex: number;
          toIndex: number;
      }
    | {
          type: "project-link/create";
          projectId: string;
          link?: ResumeLinkInput;
      }
    | {
          type: "project-link/update";
          projectId: string;
          linkId: string;
          patch: ResumeLinkInput;
      }
    | {
          type: "project-link/delete";
          projectId: string;
          linkId: string;
      }
    | {
          type: "project-link/reorder";
          projectId: string;
          fromIndex: number;
          toIndex: number;
      }
    | {
          type: "section/visibility";
          sectionId: BuiltInSectionId;
          visible: boolean;
      }
    | { type: "settings/update"; patch: Partial<WorkspaceSettings> }
    | { type: "document/settings/update"; patch: Partial<ResumeSettings> }
    | { type: "step/set"; step: ResumeStep };

const BUILT_IN_SECTION_DETAILS: Record<
    BuiltInSectionId,
    { title: string; description: string }
> = {
    summary: {
        title: "Profile Summary",
        description: "A brief summary of your professional background.",
    },
    experience: {
        title: "Experience",
        description: "Work experience and internships.",
    },
    education: {
        title: "Education",
        description: "Educational background.",
    },
    projects: {
        title: "Projects",
        description: "Personal or professional projects.",
    },
    skills: {
        title: "Skills",
        description: "Technical and soft skills.",
    },
    certifications: {
        title: "Certifications",
        description: "Professional certifications and licenses.",
    },
    awards: {
        title: "Awards",
        description: "Awards and recognitions.",
    },
    languages: {
        title: "Languages",
        description: "Languages spoken and proficiency levels.",
    },
};

/** All sections supported by the editor, including optional sections. */
export const BUILT_IN_SECTIONS: readonly SectionLayout[] =
    BUILT_IN_SECTION_IDS.map((id) => ({
        id,
        ...BUILT_IN_SECTION_DETAILS[id],
        visible: true,
    }));

/** Matches the original Svelte profile's initial section order. */
export const DEFAULT_SECTION_IDS: readonly BuiltInSectionId[] = [
    "experience",
    "education",
    "projects",
    "skills",
];

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
    autosave: true,
    autosaveDebounceMs: 500,
};

export const DEFAULT_RESUME_SETTINGS: ResumeSettings = {
    pageSize: "A4",
    template: "tenali",
    titleFont: "Arial",
    bodyFont: "Arial",
    accentColor: "#004aad",
};

export const createIdFactory = (seed = Math.random): IdFactory => {
    let sequence = 0;
    return (prefix: string) => {
        sequence += 1;
        const randomPart = Math.floor(seed() * 0xffffffff)
            .toString(36)
            .padStart(7, "0");
        return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}-${randomPart}`;
    };
};

export const defaultIdFactory = createIdFactory();

export const defaultNow = (): string => new Date().toISOString();

const asRecord = (value: unknown): Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

const asArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : [];

const asString = (value: unknown, fallback = ""): string =>
    typeof value === "string" ? value.trim() : fallback;

// Live controlled fields must keep a trailing space between keystrokes. Import
// normalization uses asString; reducer update paths use this raw variant.
const asEditableString = (value: unknown, fallback = ""): string =>
    typeof value === "string" ? value : fallback;

const asDate = (value: unknown, fallback: string): string => {
    const result = asString(value);
    return result || fallback;
};

const asBoolean = (value: unknown, fallback: boolean): boolean =>
    typeof value === "boolean" ? value : fallback;

const uniqueId = (
    candidate: unknown,
    prefix: string,
    used: Set<string>,
    idFactory: IdFactory
): string => {
    let id = asString(candidate);
    if (!id || used.has(id)) {
        do {
            id = idFactory(prefix);
        } while (used.has(id));
    }
    used.add(id);
    return id;
};

const sectionDetails = (id: BuiltInSectionId) => BUILT_IN_SECTION_DETAILS[id];

const isBuiltInSectionId = (value: unknown): value is BuiltInSectionId =>
    typeof value === "string" &&
    (BUILT_IN_SECTION_IDS as readonly string[]).includes(value);

const normalizeStep = (value: unknown): ResumeStep => {
    if (value === "personal_info") return "personal-info";
    if (value === "personalInfo") return "personal-info";
    if (value === "personal-info" || isBuiltInSectionId(value)) return value;
    return "personal-info";
};

const resolveStepForSections = (
    value: unknown,
    sections: readonly SectionLayout[]
): ResumeStep => {
    const step = normalizeStep(value);
    if (step === "personal-info") return step;
    return sections.some((section) => section.id === step && section.visible)
        ? step
        : "personal-info";
};

export const resolveValidResumeStep = (
    document: Pick<ResumeDocument, "sections">,
    value: unknown
): ResumeStep => resolveStepForSections(value, document.sections);

const safeProficiency = (value: unknown): LanguageProficiency => {
    const normalized = asString(value);
    return (
        ["Basic", "Conversational", "Proficient", "Fluent"] as const
    ).includes(normalized as LanguageProficiency)
        ? (normalized as LanguageProficiency)
        : "Basic";
};

const normalizeLink = (
    value: unknown,
    prefix: string,
    used: Set<string>,
    idFactory: IdFactory
): ResumeLink => {
    const source = asRecord(value);
    return {
        id: uniqueId(source.id, prefix, used, idFactory),
        title: asString(source.title ?? source.name),
        url: asString(source.url ?? source.href),
    };
};

const normalizeSectionLayout = (
    value: unknown,
    idFactory: IdFactory
): SectionLayout[] => {
    const sourceItems = Array.isArray(value) ? value : DEFAULT_SECTION_IDS;
    const used = new Set<string>();
    const result: SectionLayout[] = [];
    for (const item of sourceItems) {
        if (typeof item === "string" && isBuiltInSectionId(item)) {
            if (used.has(item)) continue;
            used.add(item);
            const detail = sectionDetails(item);
            result.push({ id: item, ...detail, visible: true });
            continue;
        }
        const source = asRecord(item);
        const rawId = source.id ?? source.key ?? source.type;
        if (!isBuiltInSectionId(rawId) || used.has(rawId)) continue;
        used.add(rawId);
        const detail = sectionDetails(rawId);
        result.push({
            id: rawId,
            title: asString(source.title ?? source.name, detail.title),
            description: asString(source.description, detail.description),
            visible: asBoolean(source.visible, true),
        });
    }
    // idFactory is intentionally accepted so this helper has the same seam as
    // the other normalisers if optional/custom section IDs are added later.
    void idFactory;
    return result;
};

const normalizeSectionsInput = (
    value: CreateDocumentInput["sections"],
    idFactory: IdFactory
): SectionLayout[] | undefined => {
    if (!value) return undefined;
    if (value.every((item) => typeof item === "string")) {
        return normalizeSectionLayout(value, idFactory);
    }
    return normalizeSectionLayout(value, idFactory);
};

const isEntryBlank = (section: RepeatableSection, entry: RepeatableEntry) => {
    switch (section) {
        case "experience":
            return ![
                (entry as ExperienceEntry).company,
                (entry as ExperienceEntry).title,
                (entry as ExperienceEntry).location,
                (entry as ExperienceEntry).startDate,
                (entry as ExperienceEntry).endDate,
                (entry as ExperienceEntry).description,
            ].some(Boolean);
        case "education":
            return ![
                (entry as EducationEntry).institution,
                (entry as EducationEntry).location,
                (entry as EducationEntry).degree,
                (entry as EducationEntry).startDate,
                (entry as EducationEntry).endDate,
                (entry as EducationEntry).description,
            ].some(Boolean);
        case "projects":
            return ![
                (entry as ProjectEntry).title,
                (entry as ProjectEntry).description,
                (entry as ProjectEntry).startDate,
                (entry as ProjectEntry).endDate,
                (entry as ProjectEntry).skills.length,
                (entry as ProjectEntry).links.length,
            ].some(Boolean);
        case "skills":
            return ![(entry as SkillEntry).name, (entry as SkillEntry).category].some(
                Boolean
            );
        case "certifications":
            return ![
                (entry as CertificationEntry).name,
                (entry as CertificationEntry).issuer,
                (entry as CertificationEntry).date,
                (entry as CertificationEntry).url,
            ].some(Boolean);
        case "languages":
            return !(entry as LanguageEntry).name;
    }
};

const normalizeExperience = (
    value: unknown,
    options: Required<Pick<NormalizationOptions, "idFactory" | "sanitizer">>,
    preserveEmptyEntries: boolean
): ExperienceEntry[] => {
    const used = new Set<string>();
    return asArray(value)
        .map((item) => {
            const source = asRecord(item);
            const entry: ExperienceEntry = {
                id: uniqueId(source.id, "experience", used, options.idFactory),
                company: asString(source.company),
                title: asString(source.title ?? source.role),
                location: asString(source.location),
                startDate: asString(source.startDate ?? source.start_date),
                endDate: asString(source.endDate ?? source.end_date),
                description: options.sanitizer.sanitize(
                    asString(source.description)
                ),
            };
            return entry;
        })
        .filter((entry) => preserveEmptyEntries || !isEntryBlank("experience", entry));
};

const normalizeEducation = (
    value: unknown,
    options: Required<Pick<NormalizationOptions, "idFactory" | "sanitizer">>,
    preserveEmptyEntries: boolean
): EducationEntry[] => {
    const used = new Set<string>();
    return asArray(value)
        .map((item) => {
            const source = asRecord(item);
            const entry: EducationEntry = {
                id: uniqueId(source.id, "education", used, options.idFactory),
                institution: asString(source.institution),
                location: asString(source.location),
                degree: asString(source.degree),
                startDate: asString(source.startDate ?? source.start_date),
                endDate: asString(source.endDate ?? source.end_date),
                description: options.sanitizer.sanitize(
                    asString(source.description)
                ),
            };
            return entry;
        })
        .filter((entry) => preserveEmptyEntries || !isEntryBlank("education", entry));
};

const normalizeProjects = (
    value: unknown,
    options: Required<Pick<NormalizationOptions, "idFactory" | "sanitizer">>,
    preserveEmptyEntries: boolean
): ProjectEntry[] => {
    const used = new Set<string>();
    return asArray(value)
        .map((item) => {
            const source = asRecord(item);
            const linksUsed = new Set<string>();
            const entry: ProjectEntry = {
                id: uniqueId(source.id, "project", used, options.idFactory),
                title: asString(source.title ?? source.name),
                description: options.sanitizer.sanitize(
                    asString(source.description)
                ),
                skills: asArray(source.skills)
                    .map((skill) => asString(skill))
                    .filter(Boolean),
                startDate: asString(source.startDate ?? source.start_date),
                endDate: asString(source.endDate ?? source.end_date),
                links: asArray(source.links ?? source.title_links).map((link) =>
                    normalizeLink(link, "project-link", linksUsed, options.idFactory)
                ),
            };
            return entry;
        })
        .filter((entry) => preserveEmptyEntries || !isEntryBlank("projects", entry));
};

const normalizeSkills = (
    value: unknown,
    options: Required<Pick<NormalizationOptions, "idFactory" | "sanitizer">>,
    preserveEmptyEntries: boolean
): SkillEntry[] => {
    const used = new Set<string>();
    return asArray(value)
        .map((item) => {
            const source = asRecord(item);
            const entry: SkillEntry = {
                id: uniqueId(source.id, "skill", used, options.idFactory),
                name: asString(source.name),
                category: asString(source.category),
            };
            return entry;
        })
        .filter((entry) => preserveEmptyEntries || !isEntryBlank("skills", entry));
};

const normalizeCertifications = (
    value: unknown,
    options: Required<Pick<NormalizationOptions, "idFactory" | "sanitizer">>,
    preserveEmptyEntries: boolean
): CertificationEntry[] => {
    const used = new Set<string>();
    return asArray(value)
        .map((item) => {
            if (typeof item === "string") {
                return {
                    id: uniqueId(undefined, "certification", used, options.idFactory),
                    name: asString(item),
                    issuer: "",
                    date: "",
                    url: "",
                };
            }
            const source = asRecord(item);
            return {
                id: uniqueId(source.id, "certification", used, options.idFactory),
                name: asString(source.name ?? source.title),
                issuer: asString(source.issuer ?? source.organization),
                date: asString(source.date),
                url: asString(source.url),
            };
        })
        .filter(
            (entry) =>
                preserveEmptyEntries || !isEntryBlank("certifications", entry)
        );
};

const normalizeLanguages = (
    value: unknown,
    options: Required<Pick<NormalizationOptions, "idFactory" | "sanitizer">>,
    preserveEmptyEntries: boolean
): LanguageEntry[] => {
    const used = new Set<string>();
    return asArray(value)
        .map((item) => {
            const source = asRecord(item);
            return {
                id: uniqueId(source.id, "language", used, options.idFactory),
                name: asString(source.name),
                proficiency: safeProficiency(source.proficiency),
            } satisfies LanguageEntry;
        })
        .filter((entry) => preserveEmptyEntries || !isEntryBlank("languages", entry));
};

/**
 * Portraits are embedded as data URLs so documents stay self-contained in
 * localStorage and JSON exports.  The allowlist keeps opaque payloads out of
 * img srcs, and the length cap keeps one photo from exhausting the storage
 * quota.
 */
export const PORTRAIT_IMAGE_PATTERN =
    /^data:image\/(?:png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i;
export const MAX_PORTRAIT_IMAGE_LENGTH = 1_400_000;

export const isPortraitImageValue = (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    const candidate = value.trim();
    if (!candidate || candidate.length > MAX_PORTRAIT_IMAGE_LENGTH) return false;
    return (
        PORTRAIT_IMAGE_PATTERN.test(candidate) ||
        /^https?:\/\/\S+$/i.test(candidate)
    );
};

const normalizePortraitImage = (value: unknown): string | undefined => {
    const candidate = typeof value === "string" ? value.trim() : "";
    return candidate && isPortraitImageValue(candidate) ? candidate : undefined;
};

const normalizePersonalInfo = (
    value: unknown,
    idFactory: IdFactory
): PersonalInfo => {
    const source = asRecord(value);
    const used = new Set<string>();
    const image = normalizePortraitImage(source.image ?? source.portrait);
    return {
        name: asString(source.name),
        email: asString(source.email),
        phone: asString(source.phone),
        ...(image ? { image } : {}),
        titleLinks: asArray(source.titleLinks ?? source.title_links).map((link) =>
            normalizeLink(link, "link", used, idFactory)
        ),
    };
};

const normalizeSettings = (value: unknown): ResumeSettings => {
    const source = asRecord(value);
    const pageSize = source.pageSize ?? source.page_size;
    return {
        pageSize: pageSize === "Letter" ? "Letter" : "A4",
        template: asString(source.template, DEFAULT_RESUME_SETTINGS.template),
        titleFont: asString(
            source.titleFont ?? source.title_font,
            DEFAULT_RESUME_SETTINGS.titleFont
        ),
        bodyFont: asString(
            source.bodyFont ?? source.body_font,
            DEFAULT_RESUME_SETTINGS.bodyFont
        ),
        accentColor: normalizeAccentColor(
            source.accentColor ?? source.accent_color,
            DEFAULT_RESUME_SETTINGS.accentColor
        ),
    };
};

const normalizeAccentColor = (value: unknown, fallback: string): string => {
    const color = asString(value);
    return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
};

/**
 * Convert canonical or legacy profile-shaped input into the canonical
 * document.  IDs are generated only where an imported item is missing one.
 */
export const normalizeResumeDocument = (
    input: unknown,
    options: NormalizationOptions = {}
): ResumeDocument => {
    const idFactory = options.idFactory ?? defaultIdFactory;
    const now = options.now ?? defaultNow;
    const sanitizer = options.sanitizer ?? defaultRichTextSanitizer;
    const preserveEmptyEntries = options.preserveEmptyEntries ?? true;
    const source = asRecord(input);
    const metaSource = asRecord(source.meta ?? source.metadata);
    const createdAt = asDate(
        metaSource.createdAt ?? metaSource.created,
        now()
    );
    const updatedAt = asDate(
        metaSource.updatedAt ?? metaSource.lastUpdated ?? metaSource.last_updated,
        createdAt
    );
    const id = asString(metaSource.id ?? source.id) || idFactory("document");
    const config = asRecord(source.config);
    const rawSections =
        source.sections ??
        (Array.isArray(config.categories) ? config.categories : undefined);
    const sections = normalizeSectionLayout(
        rawSections ?? DEFAULT_SECTION_IDS,
        idFactory
    );
    const settings = normalizeSettings(source.settings ?? config);
    const personalInfo = normalizePersonalInfo(
        source.personalInfo ?? source.personal_info,
        idFactory
    );
    return {
        schemaVersion: WORKSPACE_SCHEMA_VERSION,
        meta: {
            id,
            name: asString(metaSource.name ?? source.name),
            description: asString(metaSource.description ?? source.description),
            createdAt,
            updatedAt,
            step: resolveStepForSections(
                metaSource.step ?? source.step,
                sections
            ),
        },
        sections,
        settings,
        personalInfo,
        summary: sanitizer.sanitize(asString(source.summary)),
        experience: normalizeExperience(source.experience, { idFactory, sanitizer }, preserveEmptyEntries),
        education: normalizeEducation(source.education, { idFactory, sanitizer }, preserveEmptyEntries),
        projects: normalizeProjects(source.projects, { idFactory, sanitizer }, preserveEmptyEntries),
        skills: normalizeSkills(source.skills, { idFactory, sanitizer }, preserveEmptyEntries),
        certifications: normalizeCertifications(
            source.certifications,
            { idFactory, sanitizer },
            preserveEmptyEntries
        ),
        awards: sanitizer.sanitize(asString(source.awards)),
        languages: normalizeLanguages(source.languages, { idFactory, sanitizer }, preserveEmptyEntries),
    };
};

/**
 * Remove unfinished rows for persistence/export while retaining one canonical
 * representation for editor state.  This mirrors the old Svelte cleanup
 * behaviour without mutating the live document.
 */
export const cleanResumeDocument = (
    document: ResumeDocument,
    options: NormalizationOptions = {}
): ResumeDocument =>
    normalizeResumeDocument(document, {
        ...options,
        preserveEmptyEntries: false,
    });

export const createEmptyResumeDocument = (
    input: CreateDocumentInput = {},
    options: NormalizationOptions = {}
): ResumeDocument => {
    const idFactory = options.idFactory ?? defaultIdFactory;
    const now = options.now ?? defaultNow;
    const sectionInput = normalizeSectionsInput(input.sections, idFactory);
    return normalizeResumeDocument(
        {
            meta: {
                id: input.id,
                name: input.name,
                description: input.description,
                createdAt: now(),
                updatedAt: now(),
                step: "personal-info",
            },
            sections: sectionInput ?? DEFAULT_SECTION_IDS,
            settings: {
                ...DEFAULT_RESUME_SETTINGS,
                template: input.template ?? DEFAULT_RESUME_SETTINGS.template,
                pageSize: input.pageSize ?? DEFAULT_RESUME_SETTINGS.pageSize,
            },
            personalInfo: {},
            summary: "",
            experience: [],
            education: [],
            projects: [],
            skills: [],
            certifications: [],
            awards: "",
            languages: [],
        },
        { ...options, idFactory, now, preserveEmptyEntries: true }
    );
};

export const createInitialWorkspaceSnapshot = (): WorkspaceSnapshot => ({
    documents: {},
    activeDocumentId: null,
    currentStep: "personal-info",
    settings: { ...DEFAULT_WORKSPACE_SETTINGS },
});

const withUpdatedDocument = (
    snapshot: WorkspaceSnapshot,
    documentId: string,
    update: (document: ResumeDocument) => ResumeDocument,
    now: string
): WorkspaceSnapshot => {
    const document = snapshot.documents[documentId];
    if (!document) return snapshot;
    const nextDocument = update(document);
    if (nextDocument === document) return snapshot;
    return {
        ...snapshot,
        documents: {
            ...snapshot.documents,
            [documentId]: {
                ...nextDocument,
                meta: { ...nextDocument.meta, updatedAt: now },
            },
        },
    };
};

const reorder = <T>(items: readonly T[], fromIndex: number, toIndex: number): T[] => {
    if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= items.length ||
        toIndex >= items.length ||
        fromIndex === toIndex
    ) {
        return [...items];
    }
    const result = [...items];
    const [item] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, item);
    return result;
};

const defaultEntry = (
    section: RepeatableSection,
    idFactory: IdFactory
): RepeatableEntry => {
    switch (section) {
        case "experience":
            return {
                id: idFactory("experience"),
                company: "",
                title: "",
                location: "",
                startDate: "",
                endDate: "",
                description: "",
            };
        case "education":
            return {
                id: idFactory("education"),
                institution: "",
                location: "",
                degree: "",
                startDate: "",
                endDate: "",
                description: "",
            };
        case "projects":
            return {
                id: idFactory("project"),
                title: "",
                description: "",
                skills: [],
                startDate: "",
                endDate: "",
                links: [],
            };
        case "skills":
            return { id: idFactory("skill"), name: "", category: "" };
        case "certifications":
            return {
                id: idFactory("certification"),
                name: "",
                issuer: "",
                date: "",
                url: "",
            };
        case "languages":
            return { id: idFactory("language"), name: "", proficiency: "Basic" };
    }
};

const normalizeEntryForSection = (
    section: RepeatableSection,
    input: RepeatableEntry,
    options: NormalizationOptions
): RepeatableEntry => {
    const idFactory = options.idFactory ?? defaultIdFactory;
    const sanitizer = options.sanitizer ?? defaultRichTextSanitizer;
    const source = asRecord(input);
    switch (section) {
        case "experience":
            return normalizeExperience(
                [source],
                { idFactory, sanitizer },
                true
            )[0];
        case "education":
            return normalizeEducation([source], { idFactory, sanitizer }, true)[0];
        case "projects":
            return normalizeProjects([source], { idFactory, sanitizer }, true)[0];
        case "skills":
            return normalizeSkills([source], { idFactory, sanitizer }, true)[0];
        case "certifications":
            return normalizeCertifications(
                [source],
                { idFactory, sanitizer },
                true
            )[0];
        case "languages":
            return normalizeLanguages([source], { idFactory, sanitizer }, true)[0];
    }
};

const updateEntry = (
    document: ResumeDocument,
    section: RepeatableSection,
    entryId: string,
    patch: Record<string, unknown>,
    options: NormalizationOptions
): ResumeDocument => {
    const items = document[section] as RepeatableEntry[];
    const index = items.findIndex((entry) => entry.id === entryId);
    if (index < 0) return document;
    const nextEntry = normalizeEntryForSection(
        section,
        { ...items[index], ...patch } as RepeatableEntry,
        options
    );
    const editableFields: Record<RepeatableSection, readonly string[]> = {
        experience: ["company", "title", "location", "startDate", "endDate", "description"],
        education: ["institution", "location", "degree", "startDate", "endDate", "description"],
        projects: ["title", "startDate", "endDate", "description"],
        skills: ["name", "category"],
        certifications: ["name", "issuer", "date", "url"],
        languages: ["name"],
    };
    const editableEntry = nextEntry as unknown as Record<string, unknown>;
    for (const field of editableFields[section]) {
        const value = patch[field];
        if (typeof value !== "string") continue;
        editableEntry[field] = field === "description"
            ? (options.sanitizer ?? defaultRichTextSanitizer).sanitize(value)
            : value;
    }
    nextEntry.id = entryId;
    const nextItems = [...items];
    nextItems[index] = nextEntry;
    return { ...document, [section]: nextItems } as ResumeDocument;
};

const duplicateEntry = (
    document: ResumeDocument,
    section: RepeatableSection,
    entryId: string,
    options: NormalizationOptions
): ResumeDocument => {
    const items = document[section] as RepeatableEntry[];
    const index = items.findIndex((entry) => entry.id === entryId);
    if (index < 0) return document;
    const idFactory = options.idFactory ?? defaultIdFactory;
    const duplicate = {
        ...items[index],
        id: idFactory(
            section === "projects"
                ? "project"
                : section === "certifications"
                  ? "certification"
                  : section === "languages"
                    ? "language"
                    : section.slice(0, -1)
        ),
    } as RepeatableEntry;
    return {
        ...document,
        [section]: [...items.slice(0, index + 1), duplicate, ...items.slice(index + 1)],
    } as ResumeDocument;
};

const createSection = (id: BuiltInSectionId): SectionLayout => ({
    id,
    ...sectionDetails(id),
    visible: true,
});

const normalizePersonalLink = (
    value: ResumeLinkInput,
    idFactory: IdFactory,
    existingIds: Set<string>
): ResumeLink => {
    let id = asString(value.id);
    if (!id || existingIds.has(id)) {
        do {
            id = idFactory("link");
        } while (existingIds.has(id));
    }
    return {
        id,
        title: asString(value.title),
        url: asString(value.url),
    };
};

/**
 * Pure state transition used by the Zustand command layer and by tests.  It
 * never mutates `snapshot`: changed branches are rebuilt with spreads and
 * everything else is returned by reference, so undo history can share
 * unchanged documents (and their portrait data URLs) instead of copying them.
 */
export const reduceWorkspace = (
    snapshot: WorkspaceSnapshot,
    action: WorkspaceCommand,
    dependencies: WorkspaceReducerDependencies = {
        idFactory: defaultIdFactory,
        now: defaultNow,
    }
): WorkspaceSnapshot => {
    const idFactory = dependencies.idFactory;
    const now = dependencies.now();
    const normalization = {
        idFactory,
        now: dependencies.now,
        sanitizer: dependencies.sanitizer,
        preserveEmptyEntries: true,
    } satisfies NormalizationOptions;

    switch (action.type) {
        case "document/create": {
            const desiredId = action.document?.id || idFactory("document");
            let id = desiredId;
            while (snapshot.documents[id]) id = idFactory("document");
            const document = createEmptyResumeDocument(
                { ...action.document, id },
                normalization
            );
            return {
                ...snapshot,
                documents: { ...snapshot.documents, [document.meta.id]: document },
                activeDocumentId: document.meta.id,
                currentStep: "personal-info",
            };
        }
        case "document/select": {
            const selected = action.documentId
                ? snapshot.documents[action.documentId]
                : undefined;
            return {
                ...snapshot,
                activeDocumentId: selected ? action.documentId : null,
                currentStep: selected?.meta.step ?? "personal-info",
            };
        }
        case "document/update": {
            const documentId = action.documentId ?? snapshot.activeDocumentId;
            if (!documentId || !snapshot.documents[documentId]) return snapshot;
            const nextSnapshot = withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const patch = action.patch;
                    const next = {
                        ...document,
                        ...patch,
                        meta: { ...document.meta, ...(patch.meta ?? {}) },
                        settings: { ...document.settings, ...(patch.settings ?? {}) },
                        personalInfo: {
                            ...document.personalInfo,
                            ...(patch.personalInfo ?? {}),
                            titleLinks:
                                patch.personalInfo?.titleLinks ??
                                document.personalInfo.titleLinks,
                        },
                    } as ResumeDocument;
                    const normalized = normalizeResumeDocument(next, normalization);
                    const rawMeta = patch.meta;
                    const rawPersonalInfo = patch.personalInfo;
                    return {
                        ...normalized,
                        ...(typeof patch.summary === "string"
                            ? { summary: (dependencies.sanitizer ?? defaultRichTextSanitizer).sanitize(patch.summary) }
                            : {}),
                        ...(typeof patch.awards === "string"
                            ? { awards: (dependencies.sanitizer ?? defaultRichTextSanitizer).sanitize(patch.awards) }
                            : {}),
                        meta: {
                            ...normalized.meta,
                            id: documentId,
                            ...(typeof rawMeta?.name === "string"
                                ? { name: rawMeta.name }
                                : {}),
                            ...(typeof rawMeta?.description === "string"
                                ? { description: rawMeta.description }
                                : {}),
                        },
                        personalInfo: {
                            ...normalized.personalInfo,
                            ...(typeof rawPersonalInfo?.name === "string"
                                ? { name: rawPersonalInfo.name }
                                : {}),
                            ...(typeof rawPersonalInfo?.email === "string"
                                ? { email: rawPersonalInfo.email }
                                : {}),
                            ...(typeof rawPersonalInfo?.phone === "string"
                                ? { phone: rawPersonalInfo.phone }
                                : {}),
                        },
                    };
                },
                now
            );
            const updated = nextSnapshot.documents[documentId];
            return snapshot.activeDocumentId === documentId && updated
                ? { ...nextSnapshot, currentStep: updated.meta.step }
                : nextSnapshot;
        }
        case "document/delete": {
            if (!snapshot.documents[action.documentId]) return snapshot;
            const documents = { ...snapshot.documents };
            delete documents[action.documentId];
            const ids = Object.keys(documents);
            const activeDocumentId =
                snapshot.activeDocumentId === action.documentId
                    ? ids[0] ?? null
                    : snapshot.activeDocumentId;
            const active = activeDocumentId ? documents[activeDocumentId] : null;
            return {
                ...snapshot,
                documents,
                activeDocumentId,
                currentStep: active?.meta.step ?? "personal-info",
            };
        }
        case "document/duplicate": {
            const source = snapshot.documents[action.documentId];
            if (!source) return snapshot;
            let id = action.newId || idFactory("document");
            while (snapshot.documents[id]) id = idFactory("document");
            const duplicate = normalizeResumeDocument(
                {
                    ...source,
                    meta: {
                        ...source.meta,
                        id,
                        name: source.meta.name ? `${source.meta.name} Copy` : "Copy",
                        createdAt: now,
                        updatedAt: now,
                    },
                },
                normalization
            );
            return {
                ...snapshot,
                documents: { ...snapshot.documents, [id]: duplicate },
                activeDocumentId: id,
                currentStep: duplicate.meta.step,
            };
        }
        case "section/add": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    if (document.sections.some((section) => section.id === action.sectionId)) {
                        return document;
                    }
                    return {
                        ...document,
                        sections: [...document.sections, createSection(action.sectionId)],
                    };
                },
                now
            );
        }
        case "section/remove": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            const next = withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const sections = document.sections.filter(
                        (section) => section.id !== action.sectionId
                    );
                    const step = resolveStepForSections(document.meta.step, sections);
                    return {
                        ...document,
                        sections,
                        meta: { ...document.meta, step },
                    };
                },
                now
            );
            const activeDocument = next.documents[documentId];
            return activeDocument
                ? {
                      ...next,
                      currentStep: resolveValidResumeStep(
                          activeDocument,
                          next.currentStep
                      ),
                  }
                : next;
        }
        case "section/rename": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    sections: document.sections.map((section) =>
                        section.id === action.sectionId
                            ? { ...section, title: action.title.trim() || section.title }
                            : section
                    ),
                }),
                now
            );
        }
        case "section/reorder": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    sections: reorder(
                        document.sections,
                        action.fromIndex,
                        action.toIndex
                    ),
                }),
                now
            );
        }
        case "entry/create": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const existingIds = new Set(
                        (document[action.section] as RepeatableEntry[]).map(
                            (item) => item.id
                        )
                    );
                    const proposedEntry = {
                        ...defaultEntry(action.section, idFactory),
                        ...(action.entry ?? {}),
                    } as RepeatableEntry;
                    if (existingIds.has(proposedEntry.id)) {
                        proposedEntry.id = idFactory(
                            action.section === "projects"
                                ? "project"
                                : action.section === "certifications"
                                  ? "certification"
                                  : action.section === "languages"
                                    ? "language"
                                    : action.section.slice(0, -1)
                        );
                    }
                    const entry = normalizeEntryForSection(
                        action.section,
                        proposedEntry,
                        normalization
                    );
                    return {
                        ...document,
                        [action.section]: [
                            ...(document[action.section] as RepeatableEntry[]),
                            entry,
                        ],
                    } as ResumeDocument;
                },
                now
            );
        }
        case "entry/update": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) =>
                    updateEntry(
                        document,
                        action.section,
                        action.entryId,
                        action.patch,
                        normalization
                    ),
                now
            );
        }
        case "entry/delete": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    [action.section]: (
                        document[action.section] as RepeatableEntry[]
                    ).filter((entry) => entry.id !== action.entryId),
                }),
                now
            );
        }
        case "entry/duplicate": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) =>
                    duplicateEntry(document, action.section, action.entryId, normalization),
                now
            );
        }
        case "entry/reorder": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    [action.section]: reorder(
                        document[action.section] as RepeatableEntry[],
                        action.fromIndex,
                        action.toIndex
                    ),
                }),
                now
            );
        }
        case "personal-link/create": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const existingIds = new Set(
                        document.personalInfo.titleLinks.map((link) => link.id)
                    );
                    const link = normalizePersonalLink(
                        action.link ?? {},
                        idFactory,
                        existingIds
                    );
                    return {
                        ...document,
                        personalInfo: {
                            ...document.personalInfo,
                            titleLinks: [...document.personalInfo.titleLinks, link],
                        },
                    };
                },
                now
            );
        }
        case "personal-link/update": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    personalInfo: {
                        ...document.personalInfo,
                        titleLinks: document.personalInfo.titleLinks.map((link) =>
                            link.id === action.linkId
                                ? {
                                      ...link,
                                      title: asEditableString(action.patch.title, link.title),
                                      url: asEditableString(action.patch.url, link.url),
                                  }
                                : link
                        ),
                    },
                }),
                now
            );
        }
        case "personal-link/delete": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    personalInfo: {
                        ...document.personalInfo,
                        titleLinks: document.personalInfo.titleLinks.filter(
                            (link) => link.id !== action.linkId
                        ),
                    },
                }),
                now
            );
        }
        case "personal-link/reorder": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    personalInfo: {
                        ...document.personalInfo,
                        titleLinks: reorder(
                            document.personalInfo.titleLinks,
                            action.fromIndex,
                            action.toIndex
                        ),
                    },
                }),
                now
            );
        }
        case "project-link/create": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const project = document.projects.find(
                        (entry) => entry.id === action.projectId
                    );
                    if (!project) return document;
                    const existingIds = new Set(project.links.map((link) => link.id));
                    const link = normalizePersonalLink(
                        action.link ?? {},
                        idFactory,
                        existingIds
                    );
                    return {
                        ...document,
                        projects: document.projects.map((entry) =>
                            entry.id === action.projectId
                                ? { ...entry, links: [...entry.links, link] }
                                : entry
                        ),
                    };
                },
                now
            );
        }
        case "project-link/update": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const project = document.projects.find(
                        (entry) => entry.id === action.projectId
                    );
                    if (!project || !project.links.some((link) => link.id === action.linkId)) {
                        return document;
                    }
                    return {
                        ...document,
                        projects: document.projects.map((entry) =>
                            entry.id === action.projectId
                                ? {
                                      ...entry,
                                      links: entry.links.map((link) =>
                                          link.id === action.linkId
                                              ? {
                                                    ...link,
                                                    title: asEditableString(
                                                        action.patch.title,
                                                        link.title
                                                    ),
                                                    url: asEditableString(
                                                        action.patch.url,
                                                        link.url
                                                    ),
                                                }
                                              : link
                                      ),
                                  }
                                : entry
                        ),
                    };
                },
                now
            );
        }
        case "project-link/delete": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    projects: document.projects.map((entry) =>
                        entry.id === action.projectId
                            ? {
                                  ...entry,
                                  links: entry.links.filter(
                                      (link) => link.id !== action.linkId
                                  ),
                              }
                            : entry
                    ),
                }),
                now
            );
        }
        case "project-link/reorder": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => ({
                    ...document,
                    projects: document.projects.map((entry) =>
                        entry.id === action.projectId
                            ? {
                                  ...entry,
                                  links: reorder(
                                      entry.links,
                                      action.fromIndex,
                                      action.toIndex
                                  ),
                              }
                            : entry
                    ),
                }),
                now
            );
        }
        case "section/visibility": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            const next = withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const sections = document.sections.map((section) =>
                        section.id === action.sectionId
                            ? { ...section, visible: action.visible }
                            : section
                    );
                    const step = resolveStepForSections(document.meta.step, sections);
                    return {
                        ...document,
                        sections,
                        meta: { ...document.meta, step },
                    };
                },
                now
            );
            const activeDocument = next.documents[documentId];
            return activeDocument
                ? {
                      ...next,
                      currentStep: resolveValidResumeStep(
                          activeDocument,
                          next.currentStep
                      ),
                  }
                : next;
        }
        case "settings/update":
            return {
                ...snapshot,
                settings: {
                    ...snapshot.settings,
                    ...action.patch,
                    autosaveDebounceMs: Math.max(
                        0,
                        action.patch.autosaveDebounceMs ??
                            snapshot.settings.autosaveDebounceMs
                    ),
                },
            };
        case "document/settings/update": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId) return snapshot;
            return withUpdatedDocument(
                snapshot,
                documentId,
                (document) => {
                    const accentColor = action.patch.accentColor;
                    const patch = {
                        ...action.patch,
                        ...(accentColor === undefined
                            ? {}
                            : {
                                  accentColor: normalizeAccentColor(
                                      accentColor,
                                      document.settings.accentColor
                                  ),
                              }),
                    };
                    return {
                        ...document,
                        settings: { ...document.settings, ...patch },
                    };
                },
                now
            );
        }
        case "step/set": {
            const documentId = snapshot.activeDocumentId;
            if (!documentId || !snapshot.documents[documentId]) {
                return { ...snapshot, currentStep: "personal-info" };
            }
            const document = snapshot.documents[documentId];
            const step = resolveValidResumeStep(document, action.step);
            return withUpdatedDocument(
                { ...snapshot, currentStep: step },
                documentId,
                (document) => ({
                    ...document,
                    meta: { ...document.meta, step },
                }),
                now
            );
        }
    }
};

export const workspaceReducer = reduceWorkspace;

const hasDocumentContent = (document: ResumeDocument, section: BuiltInSectionId) => {
    switch (section) {
        case "summary":
            return Boolean(document.summary);
        case "experience":
            return document.experience.some((entry) => !isEntryBlank(section, entry));
        case "education":
            return document.education.some((entry) => !isEntryBlank(section, entry));
        case "projects":
            return document.projects.some((entry) => !isEntryBlank(section, entry));
        case "skills":
            return document.skills.some((entry) => !isEntryBlank(section, entry));
        case "certifications":
            return document.certifications.some((entry) => !isEntryBlank(section, entry));
        case "awards":
            return Boolean(document.awards);
        case "languages":
            return document.languages.some((entry) => !isEntryBlank(section, entry));
    }
};

export interface CompletionSummary {
    percent: number;
    completed: number;
    total: number;
    bySection: Record<ResumeStep, boolean>;
}

export interface NavigationItem {
    id: ResumeStep;
    title: string;
    description: string;
    completed: boolean;
    active: boolean;
}

export interface NavigationSummary {
    items: NavigationItem[];
    current: NavigationItem | null;
    previous: NavigationItem | null;
    next: NavigationItem | null;
}

export interface DashboardSummary {
    id: string;
    name: string;
    description: string;
    updatedAt: string;
    createdAt: string;
    completion: CompletionSummary;
    isActive: boolean;
}

export interface PreviewRenderSection {
    id: BuiltInSectionId;
    title: string;
    visible: boolean;
    isEmpty: boolean;
    content:
        | string
        | ExperienceEntry[]
        | EducationEntry[]
        | ProjectEntry[]
        | SkillEntry[]
        | CertificationEntry[]
        | LanguageEntry[];
}

export interface PreviewRenderModel {
    document: ResumeDocument;
    sections: PreviewRenderSection[];
}

export const getCompletion = (document: ResumeDocument): CompletionSummary => {
    const bySection = {
        "personal-info": Boolean(
            document.personalInfo.name ||
                document.personalInfo.email ||
                document.personalInfo.phone
        ),
        summary: hasDocumentContent(document, "summary"),
        experience: hasDocumentContent(document, "experience"),
        education: hasDocumentContent(document, "education"),
        projects: hasDocumentContent(document, "projects"),
        skills: hasDocumentContent(document, "skills"),
        certifications: hasDocumentContent(document, "certifications"),
        awards: hasDocumentContent(document, "awards"),
        languages: hasDocumentContent(document, "languages"),
    } satisfies Record<ResumeStep, boolean>;
    const visibleSections = document.sections.filter((section) => section.visible);
    const total = 1 + visibleSections.length;
    const completed =
        Number(bySection["personal-info"]) +
        visibleSections.filter((section) => bySection[section.id]).length;
    return {
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
        completed,
        total,
        bySection,
    };
};

export const getNavigation = (
    document: ResumeDocument,
    currentStep: ResumeStep = document.meta.step
): NavigationSummary => {
    const completion = getCompletion(document);
    const items: NavigationItem[] = [
        {
            id: "personal-info",
            title: "Personal Info",
            description: "Your contact details and headline.",
            completed: completion.bySection["personal-info"],
            active: currentStep === "personal-info",
        },
        ...document.sections.filter((section) => section.visible).map((section) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            completed: completion.bySection[section.id],
            active: currentStep === section.id,
        })),
    ];
    const index = items.findIndex((item) => item.id === currentStep);
    const currentIndex = index >= 0 ? index : 0;
    return {
        items,
        current: items[currentIndex] ?? null,
        previous: items[currentIndex - 1] ?? null,
        next: items[currentIndex + 1] ?? null,
    };
};

export const getPreviewRenderModel = (
    document: ResumeDocument
): PreviewRenderModel => ({
    document,
    sections: document.sections.map((section) => {
        let content: PreviewRenderSection["content"];
        switch (section.id) {
            case "summary":
                content = document.summary;
                break;
            case "experience":
                content = document.experience;
                break;
            case "education":
                content = document.education;
                break;
            case "projects":
                content = document.projects;
                break;
            case "skills":
                content = document.skills;
                break;
            case "certifications":
                content = document.certifications;
                break;
            case "awards":
                content = document.awards;
                break;
            case "languages":
                content = document.languages;
                break;
        }
        return {
            id: section.id,
            title: section.title,
            visible: section.visible,
            isEmpty: !hasDocumentContent(document, section.id),
            content,
        };
    }),
});

export const getDashboardSummaries = (
    snapshot: WorkspaceSnapshot
): DashboardSummary[] =>
    Object.values(snapshot.documents).map((document) => ({
        id: document.meta.id,
        name: document.meta.name,
        description: document.meta.description,
        updatedAt: document.meta.updatedAt,
        createdAt: document.meta.createdAt,
        completion: getCompletion(document),
        isActive: document.meta.id === snapshot.activeDocumentId,
    }));

/** The value JSON.stringify writes for a non-object, or undefined where it drops one. */
const jsonScalar = (value: unknown): unknown => {
    switch (typeof value) {
        case "number":
            return Number.isFinite(value) ? value : null;
        case "undefined":
        case "function":
        case "symbol":
            return undefined;
        default:
            return value;
    }
};

const isJsonObject = (value: unknown): value is object =>
    value !== null && typeof value === "object";

/** Own keys in the order JSON.stringify writes them, skipping values it drops. */
const jsonKeys = (value: object): string[] =>
    Object.keys(value).filter((key) => {
        const item = (value as Record<string, unknown>)[key];
        return isJsonObject(item) || jsonScalar(item) !== undefined;
    });

/** JSON writes dropped array items, and holes, as null. */
const jsonArrayItem = (value: unknown): unknown =>
    isJsonObject(value) ? value : (jsonScalar(value) ?? null);

/**
 * True exactly when JSON.stringify would write the same text for both values,
 * without serializing them.  Shared references are equal without being
 * walked, so comparing two snapshots that share structure only visits the
 * branches a command rebuilt.  Key order counts, as it does in the JSON: the
 * order of `documents` decides dashboard order and which resume becomes
 * active after a delete.
 */
const jsonEqual = (left: unknown, right: unknown): boolean => {
    if (left === right) return true;
    if (!isJsonObject(left) || !isJsonObject(right)) {
        return (
            !isJsonObject(left) &&
            !isJsonObject(right) &&
            jsonScalar(left) === jsonScalar(right)
        );
    }
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right)) return false;
        if (left.length !== right.length) return false;
        for (let index = 0; index < left.length; index += 1) {
            if (!jsonEqual(jsonArrayItem(left[index]), jsonArrayItem(right[index]))) {
                return false;
            }
        }
        return true;
    }
    const leftKeys = jsonKeys(left);
    const rightKeys = jsonKeys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (let index = 0; index < leftKeys.length; index += 1) {
        const key = leftKeys[index];
        if (key !== rightKeys[index]) return false;
        if (
            !jsonEqual(
                (left as Record<string, unknown>)[key],
                (right as Record<string, unknown>)[key]
            )
        ) {
            return false;
        }
    }
    return true;
};

/**
 * Structural comparison used by the history layer on every committed change.
 * Equivalent to comparing the snapshots' JSON, but because the reducer shares
 * untouched documents and settings by reference, it never serializes the
 * workspace or its portrait data URLs.
 */
export const snapshotsEqual = (
    left: WorkspaceSnapshot,
    right: WorkspaceSnapshot
): boolean => jsonEqual(left, right);
