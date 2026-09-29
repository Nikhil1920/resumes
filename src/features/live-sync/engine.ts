/**
 * Pure live-sync engine.
 *
 * Every edit in the app is a serializable WorkspaceCommand run through the
 * pure `reduceWorkspace`. A live session shares one resume between browsers by
 * sending those commands through a local relay that numbers them. Each peer
 * keeps:
 *
 *   confirmed  the resume after every relay-numbered op it has seen
 *   pending    its own ops the relay has not echoed back yet
 *
 * and shows `confirmed` with `pending` replayed on top. Because every peer
 * applies the same ops in the relay's order, and each op carries the IDs and
 * timestamps it generated the first time, all peers converge on identical
 * resumes even when two people edit at once.
 */

import {
    createInitialWorkspaceSnapshot,
    jsonEqual,
    normalizeResumeDocument,
    reduceWorkspace,
    type NormalizationOptions,
    type ResumeDocument,
    type WorkspaceCommand,
    type WorkspaceReducerDependencies,
    type WorkspaceSnapshot,
} from "@/features/resume-workspace/model";
import type { RecordedDependencies, WorkspaceChange } from "@/features/resume-workspace/store";

/** Replaces the whole resume. Used for undo/redo, which restore snapshots rather than run commands. */
export interface ReplaceDocumentCommand {
    type: "live/replace";
    document: ResumeDocument;
}

export type LiveCommand = WorkspaceCommand | ReplaceDocumentCommand;

export interface LiveOp {
    cmdId: string;
    clientId: string;
    command: LiveCommand;
    recorded: RecordedDependencies;
}

export interface SequencedOp extends LiveOp {
    seq: number;
}

export interface SyncState {
    documentId: string;
    confirmed: ResumeDocument;
    seq: number;
    pending: LiveOp[];
}

/**
 * Commands that change resume content. Workspace-level commands (create,
 * select, delete, duplicate, app settings) and navigation (`step/set`) stay
 * local to each browser.
 */
const DOCUMENT_COMMANDS = new Set<WorkspaceCommand["type"]>([
    "document/update",
    "section/add",
    "section/remove",
    "section/rename",
    "section/reorder",
    "section/visibility",
    "entry/create",
    "entry/update",
    "entry/delete",
    "entry/duplicate",
    "entry/reorder",
    "personal-link/create",
    "personal-link/update",
    "personal-link/delete",
    "personal-link/reorder",
    "project-link/create",
    "project-link/update",
    "project-link/delete",
    "project-link/reorder",
    "document/settings/update",
]);

/** The document a command edits, or null when it should not be shared. */
export const commandTarget = (
    command: WorkspaceCommand,
    before: WorkspaceSnapshot
): string | null => {
    if (!DOCUMENT_COMMANDS.has(command.type)) return null;
    if (command.type === "document/update") {
        return command.documentId ?? before.activeDocumentId;
    }
    return before.activeDocumentId;
};

/**
 * Reducer dependencies that hand back the values recorded when the op was
 * first applied. If a replay asks for more than was recorded (which only
 * happens when peers' documents already differ), fall back to values derived
 * from the op so every peer still produces the same result.
 */
const replayDependencies = (
    op: LiveOp,
    sanitizer: NormalizationOptions["sanitizer"]
): WorkspaceReducerDependencies => {
    let idIndex = 0;
    let nowIndex = 0;
    const fallbackNow = op.recorded.nows[0] ?? new Date(0).toISOString();
    return {
        sanitizer,
        idFactory: (prefix) => op.recorded.ids[idIndex++] ?? `${prefix}-${op.cmdId}-${idIndex}`,
        now: () => op.recorded.nows[nowIndex++] ?? fallbackNow,
    };
};

/** The navigation step is per-viewer, so peers never overwrite each other's. */
const withStep = (document: ResumeDocument, step: ResumeDocument["meta"]["step"]): ResumeDocument =>
    document.meta.step === step ? document : { ...document, meta: { ...document.meta, step } };

/** Normalize a resume that arrived from a peer; it is untrusted input. */
export const normalizeIncomingDocument = (
    document: ResumeDocument,
    documentId: string,
    sanitizer?: NormalizationOptions["sanitizer"]
): ResumeDocument => {
    // Every peer normalizes the same payload, so generated IDs must be deterministic too.
    let counter = 0;
    const deterministic: NormalizationOptions = {
        idFactory: (prefix) => `${prefix}-${documentId}-seed-${++counter}`,
        now: () => document.meta?.updatedAt ?? new Date(0).toISOString(),
        sanitizer,
        preserveEmptyEntries: true,
    };
    const normalized = normalizeResumeDocument(document, deterministic);
    return { ...normalized, meta: { ...normalized.meta, id: documentId } };
};

/** Apply one op to one resume. Returns the input unchanged when the op no longer applies. */
export const applyOp = (
    document: ResumeDocument,
    op: LiveOp,
    sanitizer?: NormalizationOptions["sanitizer"]
): ResumeDocument => {
    const documentId = document.meta.id;
    if (op.command.type === "live/replace") {
        return normalizeIncomingDocument(op.command.document, documentId, sanitizer);
    }
    const command: WorkspaceCommand =
        op.command.type === "document/update" ? { ...op.command, documentId } : op.command;
    const snapshot: WorkspaceSnapshot = {
        ...createInitialWorkspaceSnapshot(),
        documents: { [documentId]: document },
        activeDocumentId: documentId,
        currentStep: document.meta.step,
    };
    const next = reduceWorkspace(snapshot, command, replayDependencies(op, sanitizer));
    return next.documents[documentId] ?? document;
};

/** The resume this peer should display: confirmed state with pending local ops on top. */
export const localDocument = (
    state: SyncState,
    step: ResumeDocument["meta"]["step"],
    sanitizer?: NormalizationOptions["sanitizer"]
): ResumeDocument =>
    withStep(
        state.pending.reduce((document, op) => applyOp(document, op, sanitizer), state.confirmed),
        step
    );

export const createSyncState = (
    documentId: string,
    seed: ResumeDocument,
    seedSeq: number,
    log: readonly SequencedOp[],
    sanitizer?: NormalizationOptions["sanitizer"]
): SyncState => {
    let confirmed = normalizeIncomingDocument(seed, documentId, sanitizer);
    let seq = seedSeq;
    for (const op of log) {
        if (op.seq <= seq) continue;
        confirmed = applyOp(confirmed, op, sanitizer);
        seq = op.seq;
    }
    return { documentId, confirmed, seq, pending: [] };
};

/**
 * Fold a relay-numbered op into the state. Our own ops leave the pending
 * queue; others' ops are applied under whatever we still have pending.
 */
export const receiveOp = (
    state: SyncState,
    op: SequencedOp,
    clientId: string,
    sanitizer?: NormalizationOptions["sanitizer"]
): SyncState => {
    if (op.seq <= state.seq) return state;
    const confirmed = applyOp(state.confirmed, op, sanitizer);
    const pending =
        op.clientId === clientId ? state.pending.filter((item) => item.cmdId !== op.cmdId) : state.pending;
    return { ...state, confirmed, seq: op.seq, pending };
};

export const addPending = (state: SyncState, op: LiveOp): SyncState => ({
    ...state,
    pending: [...state.pending, op],
});

/**
 * Turn a local store change into an op for the shared resume, or null if the
 * change does not touch it. Undo, redo, and imports become whole-document
 * replacements because they bypass the reducer.
 */
export const opFromChange = (
    change: WorkspaceChange,
    documentId: string,
    clientId: string,
    cmdId: string
): LiveOp | null => {
    if (change.kind === "command") {
        if (commandTarget(change.command, change.before) !== documentId) return null;
        return { cmdId, clientId, command: change.command, recorded: change.recorded };
    }
    const before = change.before.documents[documentId];
    const after = change.after.documents[documentId];
    if (!after || jsonEqual(before, after)) return null;
    return { cmdId, clientId, command: { type: "live/replace", document: after }, recorded: { ids: [], nows: [] } };
};

/** Replace one resume inside a workspace snapshot, keeping that viewer's step. */
export const withDocument = (
    snapshot: WorkspaceSnapshot,
    document: ResumeDocument
): WorkspaceSnapshot => {
    const existing = snapshot.documents[document.meta.id];
    const next = existing ? withStep(document, existing.meta.step) : document;
    return {
        ...snapshot,
        documents: { ...snapshot.documents, [document.meta.id]: next },
        currentStep:
            snapshot.activeDocumentId === document.meta.id ? next.meta.step : snapshot.currentStep,
    };
};

/** Compare resumes ignoring per-viewer navigation. */
export const sameContent = (left: ResumeDocument | undefined, right: ResumeDocument | undefined) =>
    jsonEqual(left && withStep(left, "personal-info"), right && withStep(right, "personal-info"));
