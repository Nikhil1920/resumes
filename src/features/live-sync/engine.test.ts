import { describe, expect, it } from "vitest";

import { createResumeWorkspaceStore, type WorkspaceChange } from "@/features/resume-workspace/store";

import { applyOp, commandTarget, opFromChange } from "./engine";

const createStore = () => {
    let next = 0;
    return createResumeWorkspaceStore({
        persistence: null,
        autoHydrate: false,
        idFactory: (prefix) => `${prefix}-${++next}`,
        now: () => "2026-01-01T00:00:00.000Z",
    });
};

describe("live-sync engine with document-targeted commands", () => {
    it("attributes an explicitly targeted command to its document, not the active one", () => {
        // WebMCP tools edit resumes by id; the open editor may show another one.
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "shared" });
        actions.createDocument({ id: "open" });
        const changes: WorkspaceChange[] = [];
        actions.subscribeChanges((change) => changes.push(change));

        actions.createEntry("skills", { name: "Go" }, "shared");

        const [change] = changes;
        expect(change?.kind).toBe("command");
        if (change?.kind !== "command") return;
        expect(commandTarget(change.command, change.before)).toBe("shared");
        expect(opFromChange(change, "shared", "agent", "op-1")).not.toBeNull();
        expect(opFromChange(change, "open", "agent", "op-1")).toBeNull();
    });

    it("shares section reordering and replays it on a peer's copy", () => {
        const store = createStore();
        const { actions } = store.getState();
        actions.createDocument({ id: "shared", sections: ["summary", "experience", "skills"] });
        const changes: WorkspaceChange[] = [];
        actions.subscribeChanges((change) => changes.push(change));

        actions.setSectionOrder(["skills"], "shared");

        const change = changes[0];
        expect(change).toBeDefined();
        const op = change && opFromChange(change, "shared", "agent", "op-1");
        expect(op).not.toBeNull();
        const peer = createStore();
        peer.getState().actions.createDocument({ id: "shared", sections: ["summary", "experience", "skills"] });
        const replayed = applyOp(peer.getState().documents.shared, op!);
        expect(replayed.sections.map((section) => section.id)).toEqual(["skills", "summary", "experience"]);
    });

    it("retargets a replayed command at the receiving peer's copy", () => {
        const store = createStore();
        store.getState().actions.createDocument({ id: "resume-live" });
        const document = store.getState().documents["resume-live"];
        const replayed = applyOp(document, {
            cmdId: "op-1",
            clientId: "agent",
            command: { type: "entry/create", section: "skills", entry: { name: "Rust" }, documentId: "elsewhere" },
            recorded: { ids: ["skill-from-agent"], nows: ["2026-01-02T00:00:00.000Z"] },
        });
        expect(replayed.skills.map((skill) => [skill.id, skill.name])).toEqual([["skill-from-agent", "Rust"]]);
    });
});
