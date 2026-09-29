/**
 * App wiring for the resume WebMCP tools.
 *
 * `<WebmcpTools />` registers the tool set with the page's model context
 * (native WebMCP when the browser provides it, otherwise the spec-shaped
 * fallback in ./model-context).  Registration is scoped to an AbortController
 * so unmounts and HMR cleanly unregister every tool.
 */

import * as React from "react";

import { resumeWorkspaceStore } from "@/features/resume-workspace/store";
import {
    downloadNativeResumePdf,
    isNativeResumePlatform,
} from "@/features/resume-preview/native-pdf";

import { liveSessionStore } from "@/features/live-sync/session";

import { ensureDocumentModelContext } from "./model-context";
import { createResumeTools } from "./tools";

/** Rendered resume sections only exist once the preview route has mounted. */
const PREVIEW_READY_SELECTOR = ".resume-preview__section";

/**
 * Open the browser print dialog over the rendered preview (or download via
 * the native bridge on Capacitor).  The preview must be on screen before
 * printing, otherwise the snapshot would capture the previous page.
 */
const printPreviewDocument = async (
    getPreviewPath: () => boolean
): Promise<void> => {
    if (isNativeResumePlatform()) {
        await downloadNativeResumePdf();
        return;
    }
    const startedAt = Date.now();
    while (
        Date.now() - startedAt < 3000 &&
        (!getPreviewPath() ||
            !document.querySelector(PREVIEW_READY_SELECTOR))
    ) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.print();
};

export const registerResumeWebmcpTools = async (
    signal?: AbortSignal
): Promise<number> => {
    const modelContext = ensureDocumentModelContext();
    // Dynamic import on purpose: a static import of the router from here
    // creates the cycle routeTree.gen → __root.tsx → webmcp → router.tsx,
    // which breaks HMR and module initialisation order.
    const { getRouter } = await import("@/router");
    const router = getRouter();
    const tools = createResumeTools({
        store: resumeWorkspaceStore,
        navigate: (to, params) =>
            router.navigate({ to, params: params as Record<string, string> }),
        getPath: () => router.state.location.pathname,
        printDocument: () =>
            printPreviewDocument(() =>
                router.state.location.pathname.endsWith("/preview")
            ),
        getLiveSession: () => {
            const session = liveSessionStore.getState();
            return {
                status: session.status,
                role: session.role,
                resumeId: session.documentId,
                peers: session.peers.map((peer) => ({
                    role: peer.role,
                    view: peer.presence?.view ?? null,
                    step: peer.presence?.step ?? null,
                })),
            };
        },
    });
    await Promise.all(
        tools.map((tool) =>
            modelContext.registerTool(tool, { signal }).catch((error) => {
                // Unmount/HMR aborts are expected; surface anything else.
                if (signal?.aborted) return;
                throw error;
            })
        )
    );
    return tools.length;
};

/**
 * Mount once near the app root.  Renders nothing; it only owns the tool
 * registration lifecycle.
 */
export function WebmcpTools(): null {
    React.useEffect(() => {
        const controller = new AbortController();
        registerResumeWebmcpTools(controller.signal).catch((error) => {
            console.warn("[webmcp] tool registration failed:", error);
        });
        return () => controller.abort();
    }, []);
    return null;
}

export { ensureDocumentModelContext, createModelContextFallback } from "./model-context";
export { createResumeTools } from "./tools";
export type {
    ModelContextLike,
    WebmcpToolDefinition,
    WebmcpToolResult,
} from "./model-context";
