import { writable } from "svelte/store";
import { defaultProfile, type ProfileType } from "@/types/profile";

export const profilesMapStore = writable(new Map<string, ProfileType>());

export const currentProfileStore = writable<ProfileType>(defaultProfile);
