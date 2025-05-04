<script lang="ts">
    import { onMount } from "svelte";
    import {
        defaultProfile,
        defaultProfileMetaData,
        type ProfileMetaDataType,
    } from "@/types/profile";
    import { generateProfileId } from "@/utils";
    import { goto } from "$app/navigation";

    onMount(() => {
        let profilesString = localStorage.getItem("profiles");
        if (!profilesString) {
            localStorage.setItem("profiles", JSON.stringify([]));
            profilesString = "[]";
        }

        const profiles: ProfileMetaDataType[] = JSON.parse(profilesString);

        if (profiles.length === 0) {
            const newId = generateProfileId();
            localStorage.setItem(
                "profiles",
                JSON.stringify([
                    {
                        ...defaultProfileMetaData,
                        id: newId,
                    },
                ])
            );
            localStorage.setItem(
                newId,
                JSON.stringify({
                    ...defaultProfile,
                    meta: {
                        ...defaultProfile.meta,
                        id: newId,
                    },
                })
            );
            goto(`/create-resume/${newId}/personal-info`);
        } else if (profiles.length === 1) {
            goto(`/create-resume/${profiles[0].id}/${profiles[0].step}`);
        } else {
            goto("/profiles");
        }
    });
</script>

Redirecting <a href="/profiles">Click here</a> if you are not redirected automatically.
