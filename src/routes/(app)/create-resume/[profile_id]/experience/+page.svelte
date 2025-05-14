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

    const updateData = (navigateToNextStep: boolean = false) => {
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
        updateProfileStep(
            data.profile.meta.id,
            navigateToNextStep ? "education" : "experience"
        );
        if (navigateToNextStep) {
            goto(`/create-resume/${data.profile.meta.id}/education`, {
                invalidateAll: true,
            });
        }
    };

    $effect(() => {
        experience_entries;
        updateData();
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="experience"
/>

<h2 class="text-2xl font-bold">Hi {data.profile.personal_info.name}!</h2>
<p>
    Enter your experience details. Add your work experience, internships, and
    volunteer work.
</p>
{#each experience_entries as experience, i}
    <div class="my-4">
        <h3 class="text-xl font-bold">Experience {i + 1}</h3>
        <ResumeExperienceInput
            bind:experience={experience_entries[i]}
            removeEntry={() => {
                experience_entries.splice(i, 1);
            }}
        />
    </div>
{/each}

<button
    type="button"
    class="btn btn-primary"
    onclick={() => {
        updateData(true);
    }}
>
    Next: Education
</button>
