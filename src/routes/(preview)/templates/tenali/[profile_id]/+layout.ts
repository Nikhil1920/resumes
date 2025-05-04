import { defaultProfile, type ProfileType } from "@/types/profile.js";
import { error } from "@sveltejs/kit";

export const ssr = false;
export const prerender = false;
export const csr = true;
export const load = async ({ params }) => {
    const { profile_id } = params;
    if (!window || !window.localStorage) {
        return {
            profile: {
                ...defaultProfile,
                meta: {
                    ...defaultProfile.meta,
                    id: profile_id,
                },
            },
        };
    }
    const profileString = localStorage.getItem(profile_id);
    if (!profileString) {
        throw error(404, "Profile not found");
    }
    try {
        const profile: ProfileType = JSON.parse(profileString);
        if (!profile) {
            throw error(404, "Profile not found");
        }
        return {
            profile,
        };
    } catch (e) {
        throw error(500, "Error parsing profile data");
    }
};
