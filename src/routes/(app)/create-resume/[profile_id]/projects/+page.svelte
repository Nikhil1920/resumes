<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeProjectInput from "@/components/ResumeProjectInput.svelte";
    import {
        defaultResumeProject,
        type ResumeProjectType,
    } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();

    let project_entries = $state<ResumeProjectType[]>(data.profile.projects);

    $effect(() => {
        if (project_entries.length === 0) {
            project_entries = [defaultResumeProject];
        }
        if (project_entries[project_entries.length - 1].title !== "") {
            project_entries.push(defaultResumeProject);
        }
    });

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                projects: project_entries,
            })
        );
        updateProfileStep(data.profile.meta.id, "skills");
        goto(`/create-resume/${data.profile.meta.id}/skills`, {
            invalidateAll: true,
        });
    };
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="projects"
/>
Hi {data.profile.personal_info.name}!
<p>Enter your Projects details</p>
{#each project_entries as project, i}
    <ResumeProjectInput
        bind:project={project_entries[i]}
        removeEntry={() => {
            project_entries.splice(i, 1);
        }}
    />
{/each}

<button type="button" class="btn btn-primary" onclick={handleSubmit}>
    Next: Skills
</button>
