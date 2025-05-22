import {
    defaultProfile,
    demoProfile,
    type ProfileType,
} from "@/types/profile.js";
import { error } from "@sveltejs/kit";

export const ssr = true;
export const prerender = true;
// export const csr = true;
export const load = async ({ params }) => {
    const { profile_id } = params;
    let noLocalStorage = false;
    try {
        window.localStorage.getItem("profiles");
    } catch (e) {
        noLocalStorage = true;
    }
    if (noLocalStorage) {
        switch (profile_id) {
            case "demo":
                return {
                    profile: demoProfile,
                };
            default:
                return {
                    profile: {
                        ...demoProfile,
                        meta: {
                            ...defaultProfile.meta,
                            id: profile_id,
                        },
                    },
                };
        }
    }
    const profileString = localStorage.getItem(profile_id);
    if (!profileString) {
        if (["demo"].includes(profile_id)) {
            return {
                profile: demoProfile,
            };
        }

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
