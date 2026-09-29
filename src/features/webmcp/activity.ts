/**
 * A small record of WebMCP tool calls, so the editor can show the user what
 * an agent is doing while it works.  Only tool names, titles, and a short
 * target label are kept; tool inputs (resume content) are never stored here.
 */

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import type { WebmcpToolDefinition } from "./model-context";

export type AgentActivityStatus = "running" | "done" | "error";

export interface AgentActivityEntry {
    id: number;
    tool: string;
    title: string;
    /** Section, step, or panel the call targeted, when the input names one. */
    target?: string;
    status: AgentActivityStatus;
    startedAt: number;
    finishedAt?: number;
}

export interface AgentActivityState {
    entries: AgentActivityEntry[];
}

const MAX_ENTRIES = 20;

export const agentActivityStore = createStore<AgentActivityState>(() => ({
    entries: [],
}));

let nextId = 0;

const targetOf = (input: Record<string, unknown>): string | undefined => {
    for (const key of ["section", "step", "panel"]) {
        const value = input[key];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
};

const update = (id: number, patch: Partial<AgentActivityEntry>) => {
    agentActivityStore.setState((state) => ({
        entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry
        ),
    }));
};

/** Wrap a tool so each call is recorded as agent activity. */
export const withActivityTracking = (
    tool: WebmcpToolDefinition
): WebmcpToolDefinition => ({
    ...tool,
    async execute(input, options) {
        const id = ++nextId;
        agentActivityStore.setState((state) => ({
            entries: [
                ...state.entries,
                {
                    id,
                    tool: tool.name,
                    title: tool.title ?? tool.name,
                    target: targetOf(input ?? {}),
                    status: "running" as const,
                    startedAt: Date.now(),
                },
            ].slice(-MAX_ENTRIES),
        }));
        try {
            const result = await tool.execute(input, options);
            update(id, {
                status: result.isError ? "error" : "done",
                finishedAt: Date.now(),
            });
            return result;
        } catch (error) {
            update(id, { status: "error", finishedAt: Date.now() });
            throw error;
        }
    },
});

export const useAgentActivity = <T>(selector: (state: AgentActivityState) => T): T =>
    useStore(agentActivityStore, selector);
