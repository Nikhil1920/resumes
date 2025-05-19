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

    const currentCategoryIndex = data.profile.config.categories.findIndex(
        (category) => category.id === "projects"
    );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${data.profile.meta.id}`, { invalidateAll: true });
    }

    let project_entries = $state<ResumeProjectType[]>(data.profile.projects);

    $effect(() => {
        if (project_entries.length === 0) {
            project_entries = [defaultResumeProject];
        }
        if (project_entries[project_entries.length - 1].title !== "") {
            project_entries.push(defaultResumeProject);
        }
    });

    const updateData = (navigateToNextStep: boolean = false) => {
        let validProjects = project_entries.filter(
            (project) => project.title !== ""
        );
        validProjects = validProjects.map((project) => {
            if (project.description === "<ul><li></li></ul>") {
                project.description = "";
            }
            return project;
        });
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                projects: validProjects,
            })
        );
        updateProfileStep(
            data.profile.meta.id,
            navigateToNextStep ? "skills" : "projects"
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
        project_entries;
        updateData();
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="projects"
/>
<h2 class="text-2xl font-bold">Hi {data.profile.personal_info.name}!</h2>
<p class="my-4">
    You can add your projects here. You can add as many as you want.
    <br />
    You can also add a description with a link to the project.
    <br />
    Add your personal projects, academic projects and open source contributions.
</p>
{#each project_entries as project, i}
    <div class="my-4">
        <h3 class="text-lg font-bold">Project {i + 1}</h3>
        <ResumeProjectInput
            bind:project={project_entries[i]}
            removeEntry={() => {
                confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                    project_entries.splice(i, 1);
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
