/**
 * Connects one workspace store to a live session, independent of transport.
 * The WebSocket client feeds relay messages into `receive` and ships whatever
 * `send` produces; tests drive two bindings through an in-memory relay.
 */

import type { ResumeDocument } from "@/features/resume-workspace/model";
import type { ResumeWorkspaceStore } from "@/features/resume-workspace/store";

import {
    addPending,
    applyOp,
    createSyncState,
    localDocument,
    opFromChange,
    receiveOp,
    sameContent,
    withDocument,
    type LiveOp,
    type SyncState,
} from "./engine";
import { CHECKPOINT_INTERVAL, type ClientMessage, type RelayMessage } from "./protocol";

export type BindingPhase =
    /** Connected; nobody has shared the resume yet and this browser does not have it. */
    | "waiting"
    /** The resume is shared and edits flow both ways. */
    | "live";

export interface LiveBinding {
    receive(message: RelayMessage): void;
    /** Messages to send after (re)connecting, before anything else. */
    greeting(): ClientMessage[];
    phase(): BindingPhase;
    dispose(): void;
}

export interface LiveBindingOptions {
    store: ResumeWorkspaceStore;
    documentId: string;
    clientId: string;
    role: "agent" | "user";
    send(message: ClientMessage): void;
    onPhaseChange?(phase: BindingPhase): void;
}

export const createLiveBinding = ({
    store,
    documentId,
    clientId,
    role,
    send,
    onPhaseChange,
}: LiveBindingOptions): LiveBinding => {
    let sync: SyncState | null = null;
    let counter = 0;
    let currentPhase: BindingPhase = "waiting";

    const setPhase = (next: BindingPhase) => {
        if (next === currentPhase) return;
        currentPhase = next;
        onPhaseChange?.(next);
    };

    const actions = () => store.getState().actions;
    const localDoc = (): ResumeDocument | undefined => store.getState().documents[documentId];

    /** Show `confirmed + pending` in the store without touching undo history for other resumes. */
    const adopt = (state: SyncState, history?: (document: ResumeDocument) => ResumeDocument) => {
        actions().applyRemote({
            current: (snapshot) =>
                withDocument(
                    snapshot,
                    localDocument(state, snapshot.documents[documentId]?.meta.step ?? state.confirmed.meta.step)
                ),
            history: history
                ? (snapshot) => {
                      const document = snapshot.documents[documentId];
                      return document ? withDocument(snapshot, history(document)) : snapshot;
                  }
                : undefined,
        });
    };

    const unsubscribe = actions().subscribeChanges((change) => {
        if (!sync) return;
        const op = opFromChange(change, documentId, clientId, `${clientId}:${Date.now().toString(36)}:${++counter}`);
        if (!op) return;
        sync = addPending(sync, op);
        send({ type: "op", op });
    });

    /** Adopt shared state, resending local ops the relay never numbered (e.g. across a reconnect). */
    const startFrom = (state: SyncState, unsent: readonly LiveOp[]) => {
        sync = state;
        for (const op of unsent) {
            sync = addPending(sync, op);
            send({ type: "op", op });
        }
        const confirmed = sync.confirmed;
        adopt(sync, () => confirmed);
        setPhase("live");
    };

    const receive = (message: RelayMessage) => {
        switch (message.type) {
            case "welcome": {
                if (message.seed) {
                    const state = createSyncState(documentId, message.seed.document, message.seed.seq, message.log);
                    const logged = new Set(message.log.map((op) => op.cmdId));
                    startFrom(state, (sync?.pending ?? []).filter((op) => !logged.has(op.cmdId)));
                    return;
                }
                const document = localDoc();
                if (!document) {
                    setPhase("waiting");
                    return;
                }
                // Share our copy. Track edits from now on so none are lost while the relay confirms.
                send({ type: "seed", document });
                sync = createSyncState(documentId, document, 0, []);
                setPhase("live");
                return;
            }
            case "seed": {
                if (message.clientId === clientId && sync) return;
                // Another peer's copy won the race to seed; edits made against ours no longer apply.
                startFrom(createSyncState(documentId, message.document, message.seq, []), []);
                return;
            }
            case "op": {
                if (!sync) return;
                const op = message.op;
                sync = receiveOp(sync, op, clientId);
                if (op.clientId !== clientId) {
                    adopt(sync, (document) => applyOp(document, op));
                } else if (sync.pending.length === 0 && !sameContent(localDoc(), sync.confirmed)) {
                    // Our replay diverged from what we showed; the relay's order wins.
                    adopt(sync);
                }
                if (sync.seq % CHECKPOINT_INTERVAL === 0 && role === "user") {
                    send({ type: "checkpoint", seq: sync.seq, document: sync.confirmed });
                }
                return;
            }
            default:
                return;
        }
    };

    return {
        receive,
        greeting: () => [{ type: "hello", clientId, role, documentId }],
        phase: () => currentPhase,
        dispose: unsubscribe,
    };
};
