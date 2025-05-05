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

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        let validEducation = education_entries.filter(
            (education) => education.institution !== ""
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
                education: education_entries,
            })
        );
        updateProfileStep(data.profile.meta.id, "projects");
        goto(`/create-resume/${data.profile.meta.id}/projects`, {
            invalidateAll: true,
        });
    };
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="education"
/>

Hi {data.profile.personal_info.name}!
<p>Enter your Education details</p>
{#each education_entries as education, i}
    <ResumeEducationInput
        bind:education={education_entries[i]}
        removeEntry={() => {
            education_entries.splice(i, 1);
        }}
    />
{/each}

<button type="button" class="btn btn-primary" onclick={handleSubmit}>
    Next: Projects
</button>
