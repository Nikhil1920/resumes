import type { ProfileMetaDataType } from "@/types/profile";

export const generateId = (length: number): string => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result;
};

export const generateProfileId = (): string => {
    return generateId(8);
};

export const updateProfileStep = (profileId: string, step: string) => {
    if (window && window.localStorage) {
        const profilesString = localStorage.getItem("profiles");
        if (profilesString) {
            const profiles: ProfileMetaDataType[] = JSON.parse(profilesString);
            const profileIndex = profiles.findIndex(
                (profile: { id: string }) => profile.id === profileId
            );
            if (profileIndex !== -1) {
                profiles[profileIndex].step = step;
                profiles[profileIndex].last_updated = new Date().toISOString();
                localStorage.setItem("profiles", JSON.stringify(profiles));
            }
        }
    }
};

export const updateProfileName = (profileId: string, name: string) => {
    console.log("updateProfileName", profileId, name);
    if (window && window.localStorage) {
        const profilesString = localStorage.getItem("profiles");
        if (profilesString) {
            const profiles: ProfileMetaDataType[] = JSON.parse(profilesString);
            const profileIndex = profiles.findIndex(
                (profile: { id: string }) => profile.id === profileId
            );
            if (profileIndex !== -1) {
                profiles[profileIndex].name = name;
                profiles[profileIndex].last_updated = new Date().toISOString();
                localStorage.setItem("profiles", JSON.stringify(profiles));
            }
        }
    } else {
        console.log("window or localStorage is not available");
    }
};

import { registerPlugin } from "@capacitor/core";

export interface SilentPDFPluginType {
    download(options: { value: string }): Promise<{ value: string }>;
    share(options: { value: string }): Promise<{ value: string }>;
}

const SilentPDF = registerPlugin<SilentPDFPluginType>("SilentPDF");

export default SilentPDF;
