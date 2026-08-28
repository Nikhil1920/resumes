<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeProjectInput from "@/components/ResumeProjectInput.svelte";
    import { currentProfile } from "@/global_state.svelte";
    import { defaultResumeProject } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    const currentCategoryIndex =
        currentProfile.data.config.categories.findIndex(
            (category) => category.id === "projects"
        );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${currentProfile.data.meta.id}`, {
            invalidateAll: true,
        });
    }

    $effect(() => {
        if (currentProfile.data.projects.length === 0) {
            currentProfile.data.projects = [defaultResumeProject];
        }
        if (
            currentProfile.data.projects[
                currentProfile.data.projects.length - 1
            ].title !== ""
        ) {
            currentProfile.data.projects.push(defaultResumeProject);
        }
    });

    const updateData = (navigateToNextStep: boolean = false) => {
        updateProfileStep(
            currentProfile.data.meta.id,
            navigateToNextStep ? "skills" : "projects"
        );
        if (navigateToNextStep) {
            goto(
                `/create-resume/${currentProfile.data.meta.id}/${currentProfile.data.config.categories[currentCategoryIndex + 1].id}`,
                {
                    invalidateAll: true,
                }
            );
        }
    };
</script>

<CreateResumeNavigationLinks
    profile_id={currentProfile.data.meta.id}
    categories={currentProfile.data.config.categories}
    active_step="projects"
/>
<p class="text-sm">Hi {currentProfile.data.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">
    List your projects, open source contributions, and personal work.
</h2>
<p class="my-4">
    You can add your projects here.
    <br />
    You can also add a description with a link to the project.
    <br />
    Add your personal projects, academic projects and open source contributions.
</p>
{#each currentProfile.data.projects as project, i}
    <div class="my-4">
        <h3 class="text-lg font-bold">Project {i + 1}</h3>
        <ResumeProjectInput
            bind:project={currentProfile.data.projects[i]}
            removeEntry={() => {
                confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                    currentProfile.data.projects.splice(i, 1);
            }}
        />
    </div>
{/each}

{#if currentCategoryIndex === currentProfile.data.config.categories.length - 1}
    <a
        href={`/templates/tenali/${currentProfile.data.meta.id}`}
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
        Next: {currentProfile.data.config.categories[currentCategoryIndex + 1]
            .name}
    </button>
{/if}
