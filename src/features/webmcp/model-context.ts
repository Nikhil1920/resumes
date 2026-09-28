/**
 * WebMCP model-context boundary.
 *
 * The WebMCP proposal (https://webmachinelearning.github.io/webmcp/) exposes
 * page tools to user agents through `document.modelContext`.  Chrome ships it
 * behind `chrome://flags/#enable-webmcp-testing` / an origin trial (Chrome
 * 149+); other browsers have not adopted it yet.
 *
 * When the native API is missing we install a spec-shaped fallback so the
 * exact same tool registrations work for any agent that can evaluate JS in
 * the page (extension agents, automation harnesses).  The fallback implements
 * the imperative-API surface used here: `registerTool`, `getTools`,
 * `executeTool`, and the `toolchange` event.
 */

export interface WebmcpContentBlock {
    type: "text";
    text: string;
}

export interface WebmcpToolResult {
    /**
     * True when the tool could not complete the request.  Chrome's native
     * WebMCP discards messages of errors thrown by execute handlers, so
     * validation failures are returned as readable content instead.
     */
    isError?: boolean;
    content: WebmcpContentBlock[];
}

export interface WebmcpToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (
        input: Record<string, unknown>,
        options: { signal: AbortSignal }
    ) => WebmcpToolResult | Promise<WebmcpToolResult>;
}

export interface WebmcpRegisteredTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    origin: string;
}

export interface WebmcpRegisterOptions {
    signal?: AbortSignal;
}

export interface WebmcpExecuteOptions {
    signal?: AbortSignal;
}

export interface ModelContextLike {
    registerTool(
        tool: WebmcpToolDefinition,
        options?: WebmcpRegisterOptions
    ): Promise<void>;
    getTools(options?: unknown): Promise<WebmcpRegisteredTool[]>;
    executeTool(
        tool: WebmcpRegisteredTool | string,
        input?: Record<string, unknown>,
        options?: WebmcpExecuteOptions
    ): Promise<unknown>;
    addEventListener(
        type: "toolchange",
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
        type: "toolchange",
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
    ): void;
}

type DocumentWithModelContext = Document & {
    modelContext?: ModelContextLike;
};

declare global {
    // Matches the WebMCP imperative API surface. When the browser ships the
    // native property this augmentation keeps type parity for app code.
    interface Document {
        modelContext?: ModelContextLike;
    }
}

const isModelContextLike = (value: unknown): value is ModelContextLike =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as ModelContextLike).registerTool === "function" &&
    typeof (value as ModelContextLike).getTools === "function" &&
    typeof (value as ModelContextLike).executeTool === "function";

/**
 * Minimal fallback implementing the WebMCP imperative API semantics used by
 * this app: duplicate-name rejection, AbortSignal-driven unregistration, and
 * structured tool results.  `executeTool` accepts either a registered tool
 * object (as returned by `getTools`) or a tool name for convenience.
 */
export const createModelContextFallback = (): ModelContextLike => {
    const definitions = new Map<string, WebmcpToolDefinition>();
    const target = new EventTarget();

    const announceChange = () => {
        target.dispatchEvent(new Event("toolchange"));
    };

    return {
        async registerTool(tool, options) {
            if (!tool || typeof tool.name !== "string" || !tool.name) {
                throw new TypeError(
                    "registerTool requires a tool definition with a name."
                );
            }
            if (definitions.has(tool.name)) {
                throw new Error(
                    `A tool named "${tool.name}" is already registered.`
                );
            }
            definitions.set(tool.name, tool);
            announceChange();
            options?.signal?.addEventListener("abort", () => {
                definitions.delete(tool.name);
                announceChange();
            });
        },
        async getTools() {
            return Array.from(definitions.values()).map((tool) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                origin: typeof location !== "undefined" ? location.origin : "",
            }));
        },
        async executeTool(tool, input, options) {
            const name = typeof tool === "string" ? tool : tool?.name;
            const definition = typeof name === "string" ? definitions.get(name) : undefined;
            if (!definition) {
                throw new Error(
                    `Tool${name ? ` "${name}"` : ""} is not registered.`
                );
            }
            const signal = options?.signal ?? new AbortController().signal;
            if (signal.aborted) {
                throw new DOMException("Tool execution aborted.", "AbortError");
            }
            return definition.execute(input ?? {}, { signal });
        },
        addEventListener: (type, listener, options) =>
            target.addEventListener(type, listener, options),
        removeEventListener: (type, listener, options) =>
            target.removeEventListener(type, listener, options),
    };
};

/**
 * Return the page's model context, installing the fallback on first use when
 * the user agent does not provide the native WebMCP API.
 */
export const ensureDocumentModelContext = (): ModelContextLike => {
    const existing = (document as DocumentWithModelContext).modelContext;
    if (isModelContextLike(existing)) return existing;
    const fallback = createModelContextFallback();
    Object.defineProperty(document, "modelContext", {
        value: fallback,
        configurable: true,
        enumerable: false,
        writable: false,
    });
    return fallback;
};

/** True when the page exposes the native WebMCP API rather than the fallback. */
export const hasNativeModelContext = (): boolean =>
    typeof document !== "undefined" &&
    isModelContextLike((document as DocumentWithModelContext).modelContext) &&
    !Object.getOwnPropertyDescriptor(document, "modelContext");
