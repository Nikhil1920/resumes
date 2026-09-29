// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    createModelContextFallback,
    ensureDocumentModelContext,
    hasNativeModelContext,
    type WebmcpToolDefinition,
    type WebmcpToolResult,
} from "./model-context";

const echoTool = (name = "echo"): WebmcpToolDefinition => ({
    name,
    description: "Echoes its input text.",
    inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
    },
    execute: async (input) => ({
        content: [{ type: "text", text: String(input.text ?? "") }],
    }),
});

describe("createModelContextFallback", () => {
    it("registers tools and exposes them through getTools", async () => {
        const context = createModelContextFallback();
        await context.registerTool(echoTool());
        const tools = await context.getTools();
        expect(tools).toHaveLength(1);
        expect(tools[0]).toMatchObject({
            name: "echo",
            description: "Echoes its input text.",
        });
        expect(typeof tools[0].origin).toBe("string");
    });

    it("executes a registered tool by object or by name", async () => {
        const context = createModelContextFallback();
        await context.registerTool(echoTool());
        const [tool] = await context.getTools();
        await expect(
            context.executeTool(tool, { text: "by object" })
        ).resolves.toEqual({
            content: [{ type: "text", text: "by object" }],
        });
        await expect(
            context.executeTool("echo", { text: "by name" })
        ).resolves.toEqual({ content: [{ type: "text", text: "by name" }] });
    });

    it("rejects duplicate tool names", async () => {
        const context = createModelContextFallback();
        await context.registerTool(echoTool());
        await expect(context.registerTool(echoTool())).rejects.toThrow(
            /already registered/
        );
    });

    it("rejects execution of unknown tools", async () => {
        const context = createModelContextFallback();
        await expect(context.executeTool("missing", {})).rejects.toThrow(
            /not registered/
        );
    });

    it("propagates errors thrown by the execute handler", async () => {
        const context = createModelContextFallback();
        await context.registerTool({
            name: "boom",
            description: "Always throws.",
            inputSchema: { type: "object" },
            execute: () => {
                throw new Error("validation failed: provide a name");
            },
        });
        await expect(context.executeTool("boom", {})).rejects.toThrow(
            "validation failed: provide a name"
        );
    });

    it("unregisters tools when the registration signal aborts", async () => {
        const context = createModelContextFallback();
        const controller = new AbortController();
        await context.registerTool(echoTool(), { signal: controller.signal });
        expect(await context.getTools()).toHaveLength(1);
        controller.abort();
        expect(await context.getTools()).toHaveLength(0);
    });

    it("fires toolchange on register and unregister", async () => {
        const context = createModelContextFallback();
        const listener = vi.fn();
        context.addEventListener("toolchange", listener);
        const controller = new AbortController();
        await context.registerTool(echoTool(), { signal: controller.signal });
        controller.abort();
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("aborts execution before starting when the signal is already aborted", async () => {
        const context = createModelContextFallback();
        const execute = vi.fn(
            (): WebmcpToolResult => ({ content: [{ type: "text", text: "nope" }] })
        );
        await context.registerTool({
            name: "never",
            description: "Never runs.",
            inputSchema: { type: "object" },
            execute,
        });
        const controller = new AbortController();
        controller.abort();
        await expect(
            context.executeTool("never", {}, { signal: controller.signal })
        ).rejects.toThrow(/aborted/i);
        expect(execute).not.toHaveBeenCalled();
    });
});

describe("ensureDocumentModelContext", () => {
    const setDocumentModelContext = (value: unknown) => {
        Object.defineProperty(document, "modelContext", {
            value,
            configurable: true,
        });
    };

    it("installs a fallback when the user agent has none and reuses it", async () => {
        setDocumentModelContext(undefined);
        const first = ensureDocumentModelContext();
        const second = ensureDocumentModelContext();
        expect(first).toBe(second);
        expect(hasNativeModelContext()).toBe(false);
        await first.registerTool(echoTool("installed-on-document"));
        const installed = document.modelContext as
            | typeof first
            | undefined;
        await expect(
            installed?.executeTool("installed-on-document", { text: "x" })
        ).resolves.toEqual({ content: [{ type: "text", text: "x" }] });
    });

    it("passes the native model context through when present", () => {
        const native = createModelContextFallback();
        setDocumentModelContext(native);
        expect(ensureDocumentModelContext()).toBe(native);
        setDocumentModelContext(undefined);
    });
});
