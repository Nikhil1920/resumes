import { describe, expect, it } from "vitest";

import {
    createEmptyResumeDocument,
    type ResumeDocument,
} from "../resume-workspace/model";
import { toResumePreviewModel } from "./adapter";

const createDocument = (
    patch: Partial<ResumeDocument> = {},
): ResumeDocument => {
    const document = createEmptyResumeDocument({ id: "resume-1", name: "Ada" });
    return { ...document, ...patch };
};

describe("toResumePreviewModel", () => {
    it("preserves layout order while omitting hidden and genuinely empty sections", () => {
        const document = createDocument({
            sections: [
                { id: "skills", title: "Skills", description: "", visible: true },
                { id: "summary", title: "Summary", description: "", visible: true },
                { id: "experience", title: "Experience", description: "", visible: false },
                { id: "projects", title: "Projects", description: "", visible: true },
            ],
            summary: "<p>Builder</p>",
            skills: [
                { id: "skill-1", name: "TypeScript", category: "Languages" },
            ],
            // This row should not cause an otherwise empty section to render.
            projects: [
                {
                    id: "project-empty",
                    title: "",
                    description: "<p><br></p>",
                    skills: [],
                    startDate: "",
                    endDate: "",
                    links: [],
                },
            ],
        });

        const model = toResumePreviewModel(document);

        expect(model.sections.map((section) => section.id)).toEqual([
            "skills",
            "summary",
        ]);
        expect(model.sections[0]).toMatchObject({
            id: "skills",
            type: "skills",
            content: {
                groups: [{ id: "skills:Languages", name: "Languages", skills: ["TypeScript"] }],
            },
        });
    });

    it("groups skills in first-seen category order and retains item order", () => {
        const document = createDocument({
            sections: [{ id: "skills", title: "Skills", description: "", visible: true }],
            skills: [
                { id: "skill-a", name: "React", category: "Frontend" },
                { id: "skill-b", name: "Node.js", category: "Backend" },
                { id: "skill-c", name: "TanStack", category: "Frontend" },
                { id: "skill-empty", name: "", category: "Ignored" },
                { id: "skill-d", name: "Git", category: "" },
            ],
        });

        const model = toResumePreviewModel(document);

        expect(model.sections[0]).toMatchObject({
            content: {
                groups: [
                    { id: "skills:Frontend", name: "Frontend", skills: ["React", "TanStack"] },
                    { id: "skills:Backend", name: "Backend", skills: ["Node.js"] },
                    { id: "skills:", name: "", skills: ["Git"] },
                ],
            },
        });
    });

    it("maps personal/project/certification links only when their URLs are safe", () => {
        const document = createDocument({
            personalInfo: {
                name: "Ada Lovelace",
                email: "ada@example.com",
                phone: "",
                titleLinks: [
                    { id: "profile", title: "Website", url: "https://example.com" },
                    { id: "unsafe", title: "Unsafe", url: "javascript:alert(1)" },
                ],
            },
            sections: [
                { id: "projects", title: "Projects", description: "", visible: true },
                { id: "certifications", title: "Certifications", description: "", visible: true },
            ],
            projects: [
                {
                    id: "project-1",
                    title: "Engine",
                    description: "",
                    skills: [],
                    startDate: "",
                    endDate: "",
                    links: [
                        { id: "repo", title: "Source", url: "/repos/engine" },
                        { id: "bad-repo", title: "Bad", url: "data:text/html,nope" },
                    ],
                },
            ],
            certifications: [
                { id: "cert-1", name: "Certificate", issuer: "Institute", date: "2026", url: "javascript:nope" },
            ],
        });

        const model = toResumePreviewModel(document);

        expect(model.personalInfo.links).toEqual([
            { id: "profile", label: "Website", href: "https://example.com" },
        ]);
        expect(model.sections[0]).toMatchObject({
            content: {
                items: [{ links: [{ id: "repo", label: "Source", href: "/repos/engine" }] }],
            },
        });
        expect(model.sections[1]).toMatchObject({
            content: {
                items: [{ id: "cert-1", name: "Certificate" }],
            },
        });
        expect((model.sections[1].content as { items: Array<{ url?: string }> }).items[0].url).toBeUndefined();
    });

    it("maps a safe portrait image and drops unsafe sources", () => {
        const validImage = "data:image/png;base64,iVBORw0KGgo=";
        const document = createDocument({
            personalInfo: {
                name: "Ada Lovelace",
                email: "ada@example.com",
                phone: "",
                image: validImage,
                titleLinks: [],
            },
        });
        expect(toResumePreviewModel(document).personalInfo.image).toBe(validImage);

        const unsafe = createDocument({
            personalInfo: {
                name: "Ada Lovelace",
                email: "",
                phone: "",
                image: "data:text/html;base64,PGI+",
                titleLinks: [],
            },
        });
        expect(toResumePreviewModel(unsafe).personalInfo.image).toBeUndefined();
    });

    it("maps rich text and settings, including awards as one stable unlabeled item", () => {
        const document = createDocument({
            settings: {
                pageSize: "Letter",
                template: "modern",
                titleFont: "Georgia",
                bodyFont: "Inter",
                accentColor: "#123456",
            },
            summary: "<p>Safe <script>bad()</script> summary</p>",
            awards: "<ul><li>Won it</li></ul>",
            sections: [
                { id: "summary", title: "Profile", description: "", visible: true },
                { id: "awards", title: "Recognition", description: "", visible: true },
            ],
        });

        const model = toResumePreviewModel(document);

        expect(model).toMatchObject({
            id: "resume-1",
            template: "modern",
            titleFont: "Georgia",
            bodyFont: "Inter",
            pageSize: "Letter",
            accentColor: "#123456",
        });
        expect(model.sections).toEqual([
            {
                id: "summary",
                type: "summary",
                title: "Profile",
                visible: true,
                content: { html: "<p>Safe  summary</p>" },
            },
            {
                id: "awards",
                type: "awards",
                title: "Recognition",
                visible: true,
                content: {
                    items: [{ id: "awards:content", name: "", descriptionHtml: "<ul><li>Won it</li></ul>" }],
                },
            },
        ]);
    });
});
