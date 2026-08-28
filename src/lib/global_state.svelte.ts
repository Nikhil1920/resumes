import { defaultProfile, type ProfileType } from "@/types/profile";
import { browser } from "$app/environment";
import { onMount } from "svelte";

export class CurrentProfile {
    #currentProfileData = $state(defaultProfile);
    #isLoaded = $state(false);

    constructor(
        profile: ProfileType = defaultProfile,
        isLoaded: boolean = false
    ) {
        this.#currentProfileData = profile;
        this.#isLoaded = isLoaded;
    }

    get data() {
        return this.#currentProfileData;
    }
    get isLoaded() {
        return this.#isLoaded;
    }
    set data(data: ProfileType) {
        this.#currentProfileData = data;
    }
    set isLoaded(isLoaded: boolean) {
        this.#isLoaded = isLoaded;
    }
}

export const currentProfile = new CurrentProfile();

// Function to clean up profile data before storing it
export const cleanupProfileData = (profile: ProfileType): ProfileType => {
    console.log("Cleaning up profile data", profile);
    profile = {
        ...profile,
        projects: profile.projects
            .filter((project) => project.title !== "")
            .map((project) => {
                if (project.description === "<ul><li></li></ul>") {
                    project.description = "";
                }
                return project;
            }),
    };
    return profile;
};
