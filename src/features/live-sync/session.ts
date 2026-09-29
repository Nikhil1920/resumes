/**
 * Browser side of a live session: reads the pairing link, keeps a WebSocket
 * to the local relay open, and wires it to the workspace store through a
 * LiveBinding. Status lives in a small store the UI and WebMCP tools read.
 */

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import type { ResumeStep } from "@/features/resume-workspace/model";
import { resumeWorkspaceStore, type ResumeWorkspaceStore } from "@/features/resume-workspace/store";

import { createLiveBinding, type LiveBinding } from "./binding";
import type { ClientMessage, LivePeer, LivePresence, LiveRole, RelayMessage } from "./protocol";

export type LiveStatus =
    | "off"
    /** Opening the socket for the first time. */
    | "connecting"
    /** Connected, waiting for the other browser to share the resume. */
    | "waiting"
    | "live"
    /** Lost the relay after being connected; retrying. */
    | "reconnecting"
    /** Never reached the relay: local network access denied, or it is not running. */
    | "blocked"
    | "ended";

export interface LiveSessionState {
    status: LiveStatus;
    documentId: string | null;
    role: LiveRole;
    peers: LivePeer[];
    error: string | null;
}

export interface LiveLink {
    port: number;
    token: string;
    documentId: string;
    role: LiveRole | null;
}

const STORAGE_KEY = "resume-maker:live-session";
const CLIENT_ID_KEY = "resume-maker:live-client-id";

export const liveSessionStore = createStore<LiveSessionState>(() => ({
    status: "off",
    documentId: null,
    role: "user",
    peers: [],
    error: null,
}));

export const useLiveSession = <T,>(selector: (state: LiveSessionState) => T): T =>
    useStore(liveSessionStore, selector);

const safeSessionStorage = (): Storage | null => {
    try {
        return typeof window === "undefined" ? null : window.sessionStorage;
    } catch {
        return null;
    }
};

/**
 * Parse `#live=PORT.TOKEN[&role=agent]` on a `/resume/<id>` URL. The fragment
 * is never sent to the web server, so the token stays on this machine.
 */
export const parseLiveLink = (url: URL): LiveLink | null => {
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    const match = /^(\d{1,5})\.([\w-]{16,})$/.exec(params.get("live") ?? "");
    const documentId = /^\/resume\/([^/]+)/.exec(url.pathname)?.[1];
    if (!match || !documentId) return null;
    const role = params.get("role");
    return {
        port: Number(match[1]),
        token: match[2]!,
        documentId: decodeURIComponent(documentId),
        role: role === "agent" || role === "user" ? role : null,
    };
};

/** Read the link from the address bar (then hide it) or from this tab's earlier session. */
export const takeLiveLink = (): LiveLink | null => {
    if (typeof window === "undefined") return null;
    const storage = safeSessionStorage();
    const fromUrl = parseLiveLink(new URL(window.location.href));
    if (fromUrl) {
        storage?.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
        // Keep the token out of the visible URL, bookmarks, and shared links.
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(window.history.state, "", clean);
        return fromUrl;
    }
    try {
        const stored = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null") as LiveLink | null;
        return stored && typeof stored.port === "number" && typeof stored.token === "string" ? stored : null;
    } catch {
        return null;
    }
};

const clientIdForTab = (): string => {
    const storage = safeSessionStorage();
    const existing = storage?.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Math.random().toString(36).slice(2)}`;
    storage?.setItem(CLIENT_ID_KEY, id);
    return id;
};

/** Automation-driven browsers (Playwright, CDP, WebDriver) report navigator.webdriver. */
const detectRole = (): LiveRole =>
    typeof navigator !== "undefined" && navigator.webdriver ? "agent" : "user";

const waitForHydration = (store: ResumeWorkspaceStore) =>
    new Promise<void>((resolve) => {
        const ready = () => {
            const hydration = store.getState().persistence.hydration;
            return hydration === "hydrated" || hydration === "error";
        };
        if (ready()) return resolve();
        const unsubscribe = store.subscribe(() => {
            if (!ready()) return;
            unsubscribe();
            resolve();
        });
    });

export interface LiveSessionController {
    retry(): void;
    stop(): void;
    setPresence(presence: LivePresence): void;
}

let active: LiveSessionController | null = null;

/** Start (or return) the session for a link. Only one session runs per tab. */
export const startLiveSession = (
    link: LiveLink,
    store: ResumeWorkspaceStore = resumeWorkspaceStore
): LiveSessionController => {
    const current = liveSessionStore.getState();
    if (active && current.documentId === link.documentId && current.status !== "ended") return active;
    active?.stop();

    const role = link.role ?? detectRole();
    const clientId = clientIdForTab();
    let socket: WebSocket | null = null;
    let binding: LiveBinding | null = null;
    let everConnected = false;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let presence: LivePresence | null = null;

    const set = (patch: Partial<LiveSessionState>) => liveSessionStore.setState(patch);
    set({ status: "connecting", documentId: link.documentId, role, peers: [], error: null });

    // Edits made while disconnected stay pending in the binding and are resent after welcome;
    // presence is resent on open. Anything else can be dropped safely.
    const send = (message: ClientMessage) => {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };

    const upsertPeer = (peer: LivePeer) => {
        const peers = liveSessionStore.getState().peers.filter((item) => item.clientId !== peer.clientId);
        set({ peers: [...peers, peer] });
    };

    const handle = (message: RelayMessage) => {
        switch (message.type) {
            case "welcome":
                set({ peers: message.peers });
                binding?.receive(message);
                // The binding only reports phase *changes*; after a (re)connect, restate it.
                if (binding) set({ status: binding.phase() });
                return;
            case "presence":
                upsertPeer(message.peer);
                return;
            case "peer-left":
                set({ peers: liveSessionStore.getState().peers.filter((peer) => peer.clientId !== message.clientId) });
                return;
            case "error":
                stopped = true;
                set({ status: "ended", error: message.message });
                socket?.close();
                return;
        }
        binding?.receive(message);
    };

    const scheduleRetry = () => {
        if (stopped) return;
        attempts += 1;
        const delay = Math.min(10_000, 500 * 2 ** Math.min(attempts, 5));
        retryTimer = setTimeout(connect, delay);
    };

    function connect() {
        retryTimer = null;
        if (stopped) return;
        const ws = new WebSocket(`ws://127.0.0.1:${link.port}/?token=${encodeURIComponent(link.token)}`);
        socket = ws;
        ws.addEventListener("open", () => {
            everConnected = true;
            attempts = 0;
            if (!binding) return;
            for (const message of binding.greeting()) send(message);
            if (presence) send({ type: "presence", presence });
        });
        ws.addEventListener("message", (event) => {
            try {
                handle(JSON.parse(String(event.data)) as RelayMessage);
            } catch (error) {
                console.warn("[live-sync] ignored a malformed message", error);
            }
        });
        ws.addEventListener("close", () => {
            if (socket !== ws || stopped) return;
            socket = null;
            set({
                status: everConnected ? "reconnecting" : "blocked",
                peers: [],
                error: everConnected ? null : "Could not reach the live session on this computer.",
            });
            scheduleRetry();
        });
    }

    void waitForHydration(store).then(() => {
        if (stopped) return;
        binding = createLiveBinding({
            store,
            documentId: link.documentId,
            clientId,
            role,
            send,
            onPhaseChange: (phase) => set({ status: phase }),
        });
        connect();
    });

    const controller: LiveSessionController = {
        retry() {
            if (stopped || socket) return;
            if (retryTimer) clearTimeout(retryTimer);
            attempts = 0;
            set({ status: everConnected ? "reconnecting" : "connecting", error: null });
            connect();
        },
        stop() {
            stopped = true;
            if (retryTimer) clearTimeout(retryTimer);
            binding?.dispose();
            socket?.close();
            socket = null;
            safeSessionStorage()?.removeItem(STORAGE_KEY);
            set({ status: "off", documentId: null, peers: [], error: null });
            if (active === controller) active = null;
        },
        setPresence(next) {
            if (presence && presence.view === next.view && presence.step === next.step) return;
            presence = next;
            send({ type: "presence", presence: next });
        },
    };
    active = controller;
    return controller;
};

export const getLiveSessionController = () => active;

export const presenceFor = (pathname: string, step: ResumeStep | null): LivePresence => ({
    view: pathname.endsWith("/preview") ? "preview" : pathname.startsWith("/resume/") ? "editor" : "dashboard",
    step,
});
