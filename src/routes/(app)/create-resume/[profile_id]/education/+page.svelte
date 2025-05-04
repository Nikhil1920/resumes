<script lang="ts">
    import { goto } from "$app/navigation";
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
