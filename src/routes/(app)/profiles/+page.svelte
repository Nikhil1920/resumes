<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        defaultProfile,
        defaultProfileMetaData,
        type ProfileMetaDataType,
    } from "@/types/profile";
    import { generateProfileId } from "@/utils";
    import { onMount } from "svelte";

    let profiles: ProfileMetaDataType[] = $state([]);

    onMount(() => {
        let profilesString = localStorage.getItem("profiles");
        if (!profilesString) {
            localStorage.setItem("profiles", JSON.stringify([]));
            profilesString = "[]";
        }

        profiles = JSON.parse(profilesString);
    });

    const createNewResume = () => {
        let profilesString = localStorage.getItem("profiles");
        if (!profilesString) {
            profilesString = "[]";
            localStorage.setItem("profiles", JSON.stringify(profilesString));
        }

        const profiles: ProfileMetaDataType[] = JSON.parse(profilesString);
        const newId = generateProfileId();
        localStorage.setItem(
            "profiles",
            JSON.stringify([
                ...profiles,
                { ...defaultProfileMetaData, id: newId },
            ])
        );
        localStorage.setItem(
            newId,
            JSON.stringify({
                ...defaultProfile,
                meta: { ...defaultProfile.meta, id: newId },
            })
        );
        goto(`/create-resume/${newId}/personal-info`);
    };
</script>

<button onclick={createNewResume} class="btn btn-primary w-56">
    Create New Resume
</button>
{#each profiles as profile}
    <div class="card card-border bg-base-100 w-96">
        <div class="card-body">
            <h2 class="card-title">{profile.name || "Unnamed"}</h2>
            <p>
                {profile.description}
                <br />
                <strong>Last Updated</strong>: {new Date(
                    profile.last_updated
                ).toLocaleString()}
            </p>
            <div class="card-actions justify-end">
                <a
                    href={`/create-resume/${profile.id}/${profile.step}`}
                    class="btn btn-primary">View</a
                >
            </div>
        </div>
    </div>
{/each}
