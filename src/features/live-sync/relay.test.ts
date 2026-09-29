import { afterEach, describe, expect, it } from "vitest";

import { startLiveRelay, type LiveRelay } from "../../../scripts/live-relay.mjs";

const APP_ORIGIN = "https://resumes.byanr.com";
let relay: LiveRelay | null = null;

afterEach(async () => {
    await relay?.stop();
    relay = null;
});

async function start() {
    relay = await startLiveRelay({ documentId: "resume-1", appUrl: APP_ORIGIN, idleTimeoutMs: 0 });
    return relay;
}

/** Node's WebSocket client accepts extra headers, which lets tests pose as a page origin. */
function open(url: string, origin = APP_ORIGIN) {
    const socket = new WebSocket(url, { headers: { origin } } as unknown as string[]);
    const messages: Array<Record<string, unknown>> = [];
    const waiters: Array<() => void> = [];
    socket.addEventListener("message", (event) => {
        messages.push(JSON.parse(String(event.data)));
        waiters.splice(0).forEach((resolve) => resolve());
    });
    const opened = new Promise<void>((resolve, reject) => {
        socket.addEventListener("open", () => resolve());
        socket.addEventListener("error", () => reject(new Error("connection refused")));
    });
    const next = async (type: string) => {
        for (;;) {
            const index = messages.findIndex((message) => message.type === type);
            if (index >= 0) return messages.splice(index, 1)[0];
            await new Promise<void>((resolve) => waiters.push(resolve));
        }
    };
    const send = (message: unknown) => socket.send(JSON.stringify(message));
    return { socket, opened, next, send };
}

const socketUrl = (live: LiveRelay, token = live.token) => `ws://127.0.0.1:${live.port}/?token=${token}`;

describe("live relay", () => {
    it("builds user and agent links that keep the pairing secret in the fragment", async () => {
        const live = await start();
        const base = `${APP_ORIGIN}/resume/resume-1#live=${live.port}.${live.token}`;
        expect(live.userUrl).toBe(`${base}&role=user`);
        expect(live.agentUrl).toBe(`${base}&role=agent`);
    });

    it("rejects a wrong token", async () => {
        const live = await start();
        await expect(open(socketUrl(live, "wrong")).opened).rejects.toThrow();
    });

    it("rejects pages from other origins", async () => {
        const live = await start();
        await expect(open(socketUrl(live), "https://evil.example").opened).rejects.toThrow();
    });

    it("relays numbered ops to every browser, including large payloads", async () => {
        const live = await start();
        const agent = open(socketUrl(live));
        const user = open(socketUrl(live), "http://localhost:3000");
        await Promise.all([agent.opened, user.opened]);

        agent.send({ type: "hello", clientId: "agent-1", role: "agent", documentId: "resume-1" });
        expect((await agent.next("welcome")).seed).toBeNull();
        const document = { meta: { id: "resume-1" }, summary: "x".repeat(200_000) };
        agent.send({ type: "seed", document });
        await agent.next("seed");

        user.send({ type: "hello", clientId: "user-1", role: "user", documentId: "resume-1" });
        const welcome = await user.next("welcome");
        expect((welcome.seed as { document: unknown }).document).toEqual(document);
        expect(welcome.peers).toEqual([{ clientId: "agent-1", role: "agent", presence: null }]);

        const op = { cmdId: "c1", clientId: "agent-1", command: { type: "document/update", patch: {} }, recorded: { ids: [], nows: [] } };
        agent.send({ type: "op", op });
        agent.send({ type: "op", op });
        const received = (await user.next("op")).op as { seq: number; cmdId: string };
        expect(received).toMatchObject({ seq: 1, cmdId: "c1" });
        expect((await agent.next("op")).op).toMatchObject({ seq: 1 });

        // The first presence the agent sees is the user's join, before any view is known.
        expect((await agent.next("presence")).peer).toEqual({ clientId: "user-1", role: "user", presence: null });
        user.send({ type: "presence", presence: { view: "editor", step: "summary" } });
        expect((await agent.next("presence")).peer).toMatchObject({ clientId: "user-1", presence: { step: "summary" } });

        user.socket.close();
        expect(await agent.next("peer-left")).toEqual({ type: "peer-left", clientId: "user-1" });
        agent.socket.close();
    });

    it("refuses a browser that asks for a different resume", async () => {
        const live = await start();
        const client = open(socketUrl(live));
        await client.opened;
        client.send({ type: "hello", clientId: "c", role: "user", documentId: "someone-else" });
        expect(await client.next("error")).toMatchObject({ code: "wrong-document" });
    });
});
