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

    const currentCategoryIndex = data.profile.config.categories.findIndex(
        (category) => category.id === "experience"
    );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${data.profile.meta.id}`, { invalidateAll: true });
    }

    let experience_entries = $state(data.profile.experience || []);

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
            goto(
                `/create-resume/${data.profile.meta.id}/${data.profile.config.categories[currentCategoryIndex + 1].id}`,
                {
                    invalidateAll: true,
                }
            );
        }
    };

    $effect(() => {
        experience_entries;
        updateData();
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="experience"
/>

<p class="text-sm">Hi {data.profile.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">Enter your work experience details</h2>
<p>
    List all your work experience, internships, and volunteer work related to
    the job you are applying for. You can add multiple entries.
</p>
{#each experience_entries as experience, i}
    <div class="my-4">
        <h3 class="text-xl font-bold">Experience {i + 1}</h3>
        <ResumeExperienceInput
            bind:experience={experience_entries[i]}
            removeEntry={() => {
                confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                    experience_entries.splice(i, 1);
            }}
        />
    </div>
{/each}

{#if currentCategoryIndex === data.profile.config.categories.length - 1}
    <a
        href={`/templates/tenali/${data.profile.meta.id}`}
        class="btn btn-primary my-4"
        data-sveltekit-reload
    >
        Preview
    </a>
{:else}
    <button
        type="button"
        class="btn btn-primary mt-4"
        onclick={() => {
            updateData(true);
        }}
    >
        Next: {data.profile.config.categories[currentCategoryIndex + 1].name}
    </button>
{/if}
