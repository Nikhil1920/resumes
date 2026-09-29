import { describe, expect, it } from "vitest";

import { createResumeWorkspaceStore, type ResumeWorkspaceStore } from "@/features/resume-workspace/store";

import { createRelaySession, type RelaySession } from "../../../scripts/live-relay-session.mjs";
import { createLiveBinding, type LiveBinding } from "./binding";
import { sameContent } from "./engine";
import type { ClientMessage, RelayMessage } from "./protocol";

const DOCUMENT_ID = "resume-live";

/**
 * In-memory network: messages queue until `flush`, so tests can make edits on
 * both sides "at the same time" and then let the relay order them.
 */
function createNetwork() {
    const relay: RelaySession = createRelaySession({ documentId: DOCUMENT_ID });
    const queue: Array<() => void> = [];

    function join(store: ResumeWorkspaceStore, clientId: string, role: "agent" | "user" = "user") {
        let connected = false;
        let peer: ReturnType<RelaySession["connect"]>;
        // One binding for the life of the tab; sockets come and go underneath it.
        const binding: LiveBinding = createLiveBinding({
            store,
            documentId: DOCUMENT_ID,
            clientId,
            role,
            send: (message: ClientMessage) => {
                const target = peer;
                if (connected) queue.push(() => target.receive(JSON.parse(JSON.stringify(message))));
            },
        });
        const connect = () => {
            let open = true;
            connected = true;
            peer = relay.connect({
                send: (message) => {
                    if (open) queue.push(() => open && binding.receive(message as RelayMessage));
                },
                close: () => {
                    open = false;
                },
            });
            for (const message of binding.greeting()) {
                const target = peer;
                queue.push(() => target.receive(message));
            }
            return () => {
                open = false;
                connected = false;
            };
        };
        let closeSocket = connect();
        return {
            binding,
            disconnect() {
                closeSocket();
                peer.closed();
            },
            reconnect() {
                closeSocket = connect();
            },
        };
    }

    function flush() {
        for (let guard = 0; queue.length > 0; guard += 1) {
            if (guard > 10_000) throw new Error("network did not settle");
            queue.shift()!();
        }
    }

    return { relay, join, flush };
}

function storeWithResume() {
    const store = createResumeWorkspaceStore({ persistence: null, autoHydrate: false });
    store.getState().actions.createDocument({ id: DOCUMENT_ID, name: "Backend Engineer" });
    return store;
}

const emptyStore = () => createResumeWorkspaceStore({ persistence: null, autoHydrate: false });
const doc = (store: ResumeWorkspaceStore) => store.getState().documents[DOCUMENT_ID];
const actions = (store: ResumeWorkspaceStore) => store.getState().actions;

function pairedSession() {
    const network = createNetwork();
    const agent = storeWithResume();
    const user = emptyStore();
    const agentLink = network.join(agent, "agent-1", "agent");
    network.flush();
    const userLink = network.join(user, "user-1", "user");
    network.flush();
    actions(user).selectDocument(DOCUMENT_ID);
    return { network, agent, user, agentLink, userLink };
}

describe("live sync binding", () => {
    it("gives a browser without the resume the shared copy", () => {
        const { agent, user, userLink } = pairedSession();
        expect(userLink.binding.phase()).toBe("live");
        expect(doc(user)?.meta.name).toBe("Backend Engineer");
        expect(sameContent(doc(user), doc(agent))).toBe(true);
    });

    it("replays generated entry IDs so both sides reference the same entry", () => {
        const { network, agent, user } = pairedSession();
        const entryId = actions(agent).createEntry("experience", { company: "Acme", title: "Engineer" });
        network.flush();
        expect(entryId).toBeTruthy();
        expect(doc(user)?.experience.map((entry) => entry.id)).toContain(entryId);

        actions(user).updateEntry("experience", entryId!, { title: "Senior Engineer" });
        network.flush();
        expect(doc(agent)?.experience.find((entry) => entry.id === entryId)?.title).toBe("Senior Engineer");
        expect(sameContent(doc(user), doc(agent))).toBe(true);
    });

    it("converges when both sides edit the same field at once", () => {
        const { network, agent, user } = pairedSession();
        actions(agent).updateDocument({ personalInfo: { name: "Agent's pick" } }, DOCUMENT_ID);
        actions(user).updateDocument({ personalInfo: { name: "User's pick" } }, DOCUMENT_ID);
        network.flush();
        expect(sameContent(doc(user), doc(agent))).toBe(true);
        expect(["Agent's pick", "User's pick"]).toContain(doc(agent)?.personalInfo.name);
    });

    it("keeps concurrent edits to different fields", () => {
        const { network, agent, user } = pairedSession();
        actions(agent).updateDocument({ summary: "Builds reliable APIs." }, DOCUMENT_ID);
        actions(user).updateDocument({ personalInfo: { email: "me@example.com" } }, DOCUMENT_ID);
        network.flush();
        for (const store of [agent, user]) {
            expect(doc(store)?.summary).toContain("Builds reliable APIs.");
            expect(doc(store)?.personalInfo.email).toBe("me@example.com");
        }
    });

    it("lets undo revert only the local edit and shares the result", () => {
        const { network, agent, user } = pairedSession();
        actions(user).updateDocument({ personalInfo: { email: "typo@example.com" } }, DOCUMENT_ID);
        network.flush();
        actions(agent).updateDocument({ summary: "Agent summary." }, DOCUMENT_ID);
        network.flush();

        actions(user).undo();
        network.flush();
        for (const store of [agent, user]) {
            expect(doc(store)?.personalInfo.email).toBe("");
            expect(doc(store)?.summary).toContain("Agent summary.");
        }
        expect(sameContent(doc(user), doc(agent))).toBe(true);
    });

    it("does not share which section each person is viewing", () => {
        const { network, agent, user } = pairedSession();
        actions(agent).selectDocument(DOCUMENT_ID);
        actions(user).setCurrentStep("experience");
        actions(agent).updateDocument({ summary: "Hello." }, DOCUMENT_ID);
        network.flush();
        expect(doc(user)?.meta.step).toBe("experience");
        expect(doc(agent)?.meta.step).toBe("personal-info");
    });

    it("brings a late joiner up to date after checkpoints trim the log", () => {
        const { network, agent } = pairedSession();
        for (let index = 0; index < 60; index += 1) {
            actions(agent).updateDocument({ meta: { name: `Version ${index}` } }, DOCUMENT_ID);
        }
        network.flush();
        expect(network.relay.seq).toBe(60);

        const late = emptyStore();
        network.join(late, "user-2");
        network.flush();
        expect(doc(late)?.meta.name).toBe("Version 59");
        expect(sameContent(doc(late), doc(agent))).toBe(true);
    });

    it("sends edits made while disconnected exactly once after reconnecting", () => {
        const { network, agent, user, userLink } = pairedSession();
        actions(user).updateDocument({ summary: "Sent before the drop." }, DOCUMENT_ID);
        network.flush();
        userLink.disconnect();
        actions(user).updateDocument({ personalInfo: { phone: "555-0100" } }, DOCUMENT_ID);
        network.flush();
        expect(doc(agent)?.personalInfo.phone).toBe("");

        userLink.reconnect();
        network.flush();
        expect(userLink.binding.phase()).toBe("live");
        expect(network.relay.seq).toBe(2);
        expect(doc(agent)?.personalInfo.phone).toBe("555-0100");
        expect(doc(agent)?.summary).toContain("Sent before the drop.");
        expect(sameContent(doc(user), doc(agent))).toBe(true);
    });
});
