import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.byanr.resumes",
    appName: "Resume Maker 9000",
    // Keep the native bundle separate from web-only guides and search assets.
    webDir: "build/capacitor/client",
};

export default config;
