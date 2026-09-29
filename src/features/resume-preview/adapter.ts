import { sanitizeRichText } from "../resume-workspace/rich-text";
import {
    isPortraitImageValue,
    type EducationEntry,
    type ExperienceEntry,
    type ProjectEntry,
    type ResumeDocument,
    type ResumeLink,
    type SectionLayout,
    type SkillEntry,
} from "../resume-workspace/model";
import type {
    PreviewAwardItem,
    PreviewCertificationItem,
    PreviewEducationItem,
    PreviewExperienceItem,
    PreviewLanguageItem,
    PreviewLink,
    PreviewPersonalInfo,
    PreviewProjectItem,
    PreviewSection,
    PreviewSkillGroup,
    ResumePreviewModel,
} from "./index";

/**
 * URLs accepted by the preview renderer.  This intentionally matches the
 * renderer's link policy so an adapted model can also be serialized safely.
 */
export const isSafePreviewUrl = (value: string): boolean =>
    /^(?:https?:|mailto:|tel:|\/|#)/i.test(value.trim());

const text = (value: string | undefined): string => value?.trim() ?? "";

const optionalText = (value: string | undefined): string | undefined => {
    const result = text(value);
    return result || undefined;
};

const richText = (value: string | undefined): string =>
    sanitizeRichText(value ?? "");

const safeLink = (link: ResumeLink): PreviewLink | null => {
    const href = text(link.url);
    if (!href || !isSafePreviewUrl(href)) return null;
    return {
        id: link.id,
        label: text(link.title) || href,
        href,
    };
};

const safeLinks = (links: readonly ResumeLink[]): PreviewLink[] =>
    links.map(safeLink).filter((link): link is PreviewLink => link !== null);

const hasAny = (...values: Array<string | undefined>): boolean =>
    values.some((value) => Boolean(text(value)));

const experienceItem = (entry: ExperienceEntry): PreviewExperienceItem | null => {
    const descriptionHtml = richText(entry.description);
    if (
        !hasAny(
            entry.title,
            entry.company,
            entry.location,
            entry.startDate,
            entry.endDate,
            descriptionHtml,
        )
    ) {
        return null;
    }
    return {
        id: entry.id,
        title: text(entry.title),
        company: text(entry.company),
        location: optionalText(entry.location),
        startDate: optionalText(entry.startDate),
        endDate: optionalText(entry.endDate),
        descriptionHtml: optionalText(descriptionHtml),
    };
};

const educationItem = (entry: EducationEntry): PreviewEducationItem | null => {
    const descriptionHtml = richText(entry.description);
    if (
        !hasAny(
            entry.degree,
            entry.institution,
            entry.location,
            entry.startDate,
            entry.endDate,
            descriptionHtml,
        )
    ) {
        return null;
    }
    return {
        id: entry.id,
        degree: text(entry.degree),
        institution: text(entry.institution),
        location: optionalText(entry.location),
        startDate: optionalText(entry.startDate),
        endDate: optionalText(entry.endDate),
        descriptionHtml: optionalText(descriptionHtml),
    };
};

const projectItem = (entry: ProjectEntry): PreviewProjectItem | null => {
    const descriptionHtml = richText(entry.description);
    const links = safeLinks(entry.links);
    const skills = entry.skills.map(text).filter(Boolean);
    if (
        !hasAny(entry.title, entry.startDate, entry.endDate, descriptionHtml) &&
        skills.length === 0 &&
        links.length === 0
    ) {
        return null;
    }
    return {
        id: entry.id,
        title: text(entry.title),
        descriptionHtml: optionalText(descriptionHtml),
        skills: skills.length > 0 ? skills : undefined,
        startDate: optionalText(entry.startDate),
        endDate: optionalText(entry.endDate),
        links: links.length > 0 ? links : undefined,
    };
};

const skillGroups = (skills: readonly SkillEntry[]): PreviewSkillGroup[] => {
    const groups = new Map<string, PreviewSkillGroup>();
    for (const entry of skills) {
        const name = text(entry.name);
        // A category by itself has no visible skill in the preview, so it is
        // treated as an empty editor row.
        if (!name) continue;
        const category = text(entry.category);
        const id = `skills:${category}`;
        const group = groups.get(id);
        if (group) {
            group.skills.push(name);
            continue;
        }
        groups.set(id, { id, name: category, skills: [name] });
    }
    return [...groups.values()];
};

const certificationItems = (
    document: ResumeDocument,
): PreviewCertificationItem[] =>
    document.certifications
        .map((entry) => {
            const url = text(entry.url);
            if (!hasAny(entry.name, entry.issuer, entry.date) && !isSafePreviewUrl(url)) {
                return null;
            }
            const result: PreviewCertificationItem = {
                id: entry.id,
                name: text(entry.name),
            };
            const issuer = optionalText(entry.issuer);
            const date = optionalText(entry.date);
            if (issuer) result.issuer = issuer;
            if (date) result.date = date;
            if (url && isSafePreviewUrl(url)) result.url = url;
            return result;
        })
        .filter((entry): entry is PreviewCertificationItem => entry !== null);

const languageItems = (document: ResumeDocument): PreviewLanguageItem[] =>
    document.languages
        .map((entry) => {
            const name = text(entry.name);
            if (!name) return null;
            const result: PreviewLanguageItem = {
                id: entry.id,
                name,
            };
            const proficiency = optionalText(entry.proficiency);
            if (proficiency) result.proficiency = proficiency;
            return result;
        })
        .filter((entry): entry is PreviewLanguageItem => entry !== null);

const sectionTitle = (section: SectionLayout): string | undefined =>
    optionalText(section.title);

/**
 * Convert the canonical workspace document into the serializable model used
 * by the React preview. Layout is passed explicitly so callers can preview a
 * reordered section list without creating a second copy of resume content.
 */
export const toResumePreviewModel = (
    document: ResumeDocument,
    orderedSections: readonly SectionLayout[] = document.sections,
): ResumePreviewModel => {
    const sections: PreviewSection[] = [];
    const summaryHtml = richText(document.summary);
    const groups = skillGroups(document.skills);
    const experience = document.experience
        .map(experienceItem)
        .filter((entry): entry is PreviewExperienceItem => entry !== null);
    const education = document.education
        .map(educationItem)
        .filter((entry): entry is PreviewEducationItem => entry !== null);
    const projects = document.projects
        .map(projectItem)
        .filter((entry): entry is PreviewProjectItem => entry !== null);
    const certifications = certificationItems(document);
    const languages = languageItems(document);
    const awardsHtml = richText(document.awards);

    for (const layout of orderedSections) {
        if (!layout.visible) continue;
        const title = sectionTitle(layout);
        const common = { id: layout.id, title, visible: true };
        switch (layout.id) {
            case "summary":
                if (!summaryHtml) continue;
                sections.push({ ...common, type: "summary", content: { html: summaryHtml } });
                break;
            case "experience":
                if (experience.length === 0) continue;
                sections.push({ ...common, type: "experience", content: { items: experience } });
                break;
            case "education":
                if (education.length === 0) continue;
                sections.push({ ...common, type: "education", content: { items: education } });
                break;
            case "projects":
                if (projects.length === 0) continue;
                sections.push({ ...common, type: "projects", content: { items: projects } });
                break;
            case "skills":
                if (groups.length === 0) continue;
                sections.push({ ...common, type: "skills", content: { groups } });
                break;
            case "certifications":
                if (certifications.length === 0) continue;
                sections.push({ ...common, type: "certifications", content: { items: certifications } });
                break;
            case "awards":
                if (!awardsHtml) continue;
                // Awards are a single rich-text field in the workspace. Keep
                // one deterministic item and leave its label empty rather
                // than fabricating a title or issuer for the user.
                sections.push({
                    ...common,
                    type: "awards",
                    content: {
                        items: [{ id: "awards:content", name: "", descriptionHtml: awardsHtml } satisfies PreviewAwardItem],
                    },
                });
                break;
            case "languages":
                if (languages.length === 0) continue;
                sections.push({ ...common, type: "languages", content: { items: languages } });
                break;
        }
    }

    const personalInfoSource = document.personalInfo;
    const image = isPortraitImageValue(personalInfoSource.image)
        ? personalInfoSource.image.trim()
        : undefined;
    const personalInfo: PreviewPersonalInfo = {
        id: document.meta.id,
        name: text(personalInfoSource.name),
        headline: optionalText(personalInfoSource.headline),
        email: optionalText(personalInfoSource.email),
        phone: optionalText(personalInfoSource.phone),
        location: optionalText(personalInfoSource.location),
        ...(image ? { image } : {}),
        links: safeLinks(personalInfoSource.titleLinks),
    };

    return {
        id: document.meta.id,
        title: text(document.meta.name),
        personalInfo,
        sections,
        template: text(document.settings.template),
        titleFont: text(document.settings.titleFont),
        bodyFont: text(document.settings.bodyFont),
        pageSize: document.settings.pageSize,
        accentColor: text(document.settings.accentColor),
    };
};

/** Kept as a discoverable alias for callers that prefer conversion verbs. */
export const resumeDocumentToPreviewModel = toResumePreviewModel;
