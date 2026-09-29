/**
 * Messages exchanged with the local relay (scripts/live-relay.mjs). The relay
 * never interprets resume content: it numbers ops, keeps the latest seed plus
 * the ops after it for late joiners, and forwards presence.
 */

import type { ResumeDocument, ResumeStep } from "@/features/resume-workspace/model";

import type { LiveOp, SequencedOp } from "./engine";

export type LiveRole = "agent" | "user";

export interface LivePresence {
    view: "dashboard" | "editor" | "preview";
    step: ResumeStep | null;
}

export interface LivePeer {
    clientId: string;
    role: LiveRole;
    presence: LivePresence | null;
}

export type ClientMessage =
    | { type: "hello"; clientId: string; role: LiveRole; documentId: string }
    | { type: "seed"; document: ResumeDocument }
    | { type: "op"; op: LiveOp }
    | { type: "checkpoint"; seq: number; document: ResumeDocument }
    | { type: "presence"; presence: LivePresence };

export type RelayMessage =
    | {
          type: "welcome";
          documentId: string;
          seed: { seq: number; document: ResumeDocument; clientId: string } | null;
          log: SequencedOp[];
          peers: LivePeer[];
      }
    | { type: "seed"; seq: number; document: ResumeDocument; clientId: string }
    | { type: "op"; op: SequencedOp }
    | { type: "presence"; peer: LivePeer }
    | { type: "peer-left"; clientId: string }
    | { type: "error"; code: string; message: string };

/** How often a peer offers the relay a snapshot so the op log stays short. */
export const CHECKPOINT_INTERVAL = 25;
