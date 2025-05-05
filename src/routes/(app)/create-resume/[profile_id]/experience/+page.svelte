<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeExperienceInput from "@/components/ResumeExperienceInput.svelte";
    import {
        defaultResumeExperience,
        type ResumeExperienceType,
    } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();

    let experience_entries = $state<ResumeExperienceType[]>(
        data.profile.experience
    );

    $effect(() => {
        if (experience_entries.length === 0) {
            experience_entries = [defaultResumeExperience];
        }
        if (experience_entries[experience_entries.length - 1].title !== "") {
            experience_entries.push(defaultResumeExperience);
        }
    });

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        let validExperience = experience_entries.filter(
            (experience) => experience.title !== ""
        );
        validExperience = validExperience.map((experience) => {
            if (experience.description === "<ul><li></li></ul>") {
                experience.description = "";
            }
            return experience;
        });
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                experience: validExperience,
            })
        );
        updateProfileStep(data.profile.meta.id, "education");
        goto(`/create-resume/${data.profile.meta.id}/education`, {
            invalidateAll: true,
        });
    };
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="experience"
/>

Hi {data.profile.personal_info.name}!
<p>Enter your experience details</p>
{#each experience_entries as experience, i}
    <ResumeExperienceInput
        bind:experience={experience_entries[i]}
        removeEntry={() => {
            experience_entries.splice(i, 1);
        }}
    />
{/each}

<button type="button" class="btn btn-primary" onclick={handleSubmit}
    >Next: Education</button
>
