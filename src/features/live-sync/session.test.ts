import { describe, expect, it } from "vitest";

import { parseLiveLink, presenceFor } from "./session";

describe("live session links", () => {
    it("reads the port, token, role, and resume from a pairing link", () => {
        expect(
            parseLiveLink(new URL("https://resumes.byanr.com/resume/doc-1#live=51234.abcdefghijklmnopqrstuvwx&role=agent"))
        ).toEqual({ port: 51234, token: "abcdefghijklmnopqrstuvwx", documentId: "doc-1", role: "agent" });
    });

    it("ignores links without a resume or with a malformed token", () => {
        expect(parseLiveLink(new URL("https://resumes.byanr.com/#live=51234.abcdefghijklmnopqrstuvwx"))).toBeNull();
        expect(parseLiveLink(new URL("https://resumes.byanr.com/resume/doc-1#live=51234.short"))).toBeNull();
        expect(parseLiveLink(new URL("https://resumes.byanr.com/resume/doc-1#live=abc.abcdefghijklmnopqrstuvwx"))).toBeNull();
    });

    it("leaves the role to detection when the link does not name one", () => {
        expect(parseLiveLink(new URL("https://x.test/resume/doc-1#live=1.abcdefghijklmnopqrstuvwx"))?.role).toBeNull();
    });

    it("describes where a viewer is", () => {
        expect(presenceFor("/resume/doc-1", "summary")).toEqual({ view: "editor", step: "summary" });
        expect(presenceFor("/resume/doc-1/preview", null)).toEqual({ view: "preview", step: null });
        expect(presenceFor("/", null)).toEqual({ view: "dashboard", step: null });
    });
});
