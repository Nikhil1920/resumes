<script lang="ts">
    import ResumeCategoriesList from "@/components/drag-and-drop/ResumeCategoriesList.svelte";
    import {
        allCategories,
        defaultProfileConfig,
        type ProfileConfigType,
    } from "@/types/profile";

    let { data } = $props();

    let profile_config: ProfileConfigType = $state({
        ...defaultProfileConfig,
        ...data.profile.config,
    });

    let category_ids = $derived(
        profile_config.categories.map((category) => category.id)
    );

    const removeSection = (index: number) => {
        profile_config.categories.splice(index, 1);
    };

    $effect(() => {
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                config: profile_config,
            })
        );
    });
</script>

<div>
    <h1 class="text-2xl font-bold mb-4">Configure Your New Resume</h1>
</div>

<div>
    <h2 class="text-2xl font-bold mb-2">Sections</h2>
    <p class="mb-2">
        Select the sections you want to include in your resume. You can add or
        remove sections. Drag and Drop the elements to change their order. You
        can also change the Sections names.
    </p>
    <ResumeCategoriesList bind:categories={profile_config.categories} />
</div>
<div class="flex justify-end">
    <a
        href={`/create-resume/${data.profile.meta.id}/personal-info`}
        class="btn btn-primary my-4"
        data-sveltekit-reload
    >
        Next: Personal Info
    </a>
</div>
<div>
    <h2 class="text-2xl font-bold mb-2">Available Sections</h2>
    <p class="mb-2">
        You can add any of the following sections to your resume.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each allCategories as category}
            {#if !category_ids.includes(category.id)}
                <div class="card bg-base-200 max-w-96 mb-4">
                    <div class="card-body">
                        <h3 class="card-title">
                            {category.name}
                        </h3>
                        <p>{category.description}</p>
                        <div class="card-actions justify-between">
                            <button
                                class="btn btn-primary"
                                aria-label="Add section"
                                onclick={() => {
                                    profile_config.categories.push(category);
                                }}
                            >
                                Add Section
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
</div>
