import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.byanr.resumes",
    appName: "Resume Maker 9000",
    // Keep the native bundle separate from web-only guides and search assets.
    webDir: "build/capacitor/client",
    android: {
        // Tailwind 4 requires Chromium 111 or newer.
        minWebViewVersion: 111,
    },
    server: {
        errorPath: "update-webview.html",
    },
};

export default config;
