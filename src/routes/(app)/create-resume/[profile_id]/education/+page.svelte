<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeEducationInput from "@/components/ResumeEducationInput.svelte";
    import {
        defaultResumeEducation,
        type ResumeEducationType,
    } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();

    let education_entries = $state<ResumeEducationType[]>(
        data.profile.education
    );

    $effect(() => {
        if (education_entries.length === 0) {
            education_entries = [defaultResumeEducation];
        }
        if (education_entries[education_entries.length - 1].degree !== "") {
            education_entries.push(defaultResumeEducation);
        }
    });

    const updateData = (navigateToNextStep: boolean = false) => {
        let validEducation = education_entries.filter(
            (education) =>
                education.institution !== "" && education.degree !== ""
        );
        validEducation = validEducation.map((education) => {
            if (education.description === "<ul><li></li></ul>") {
                education.description = "";
            }
            return education;
        });
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                education: validEducation,
            })
        );
        updateProfileStep(
            data.profile.meta.id,
            navigateToNextStep ? "projects" : "education"
        );
        if (navigateToNextStep) {
            goto(`/create-resume/${data.profile.meta.id}/projects`, {
                invalidateAll: true,
            });
        }
    };

    $effect(() => {
        education_entries;
        updateData();
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="education"
/>

<h2 class="text-2xl font-bold">Hi {data.profile.personal_info.name}!</h2>
<p>Enter your Education details</p>
{#each education_entries as education, i}
    <div class="my-4">
        <h3>
            Education {i + 1}
        </h3>
        <ResumeEducationInput
            bind:education={education_entries[i]}
            removeEntry={() => {
                confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                    education_entries.splice(i, 1);
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
    Next: Projects
</button>
