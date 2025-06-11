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
        remove sections change their order. You can also change the Sections
        names.
    </p>
    <ResumeCategoriesList bind:categories={profile_config.categories} />
    {#each profile_config.categories as category, index}
        <div class="card bg-base-200 max-w-96 mb-4">
            <div class="card-body">
                <h3 class="card-title">
                    {index + 1}. {category.name}
                    <button
                        class=""
                        aria-label="Edit section name"
                        onclick={() => {
                            let new_name = prompt(
                                `Enter new name for ${category.name}`
                            );
                            if (new_name) {
                                profile_config.categories[index].name =
                                    new_name;
                            }
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            class="size-4"
                        >
                            <path
                                d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z"
                            />
                            <path
                                d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"
                            />
                        </svg>
                    </button>
                </h3>

                <p>{category.description}</p>
                <div class="card-actions justify-between">
                    <div>
                        <!-- Change order -->
                        <button
                            class="btn btn-primary"
                            aria-label="Move section up"
                            disabled={index === 0}
                            onclick={() => {
                                const temp = profile_config.categories[index];
                                profile_config.categories[index] =
                                    profile_config.categories[index - 1];
                                profile_config.categories[index - 1] = temp;
                                profile_config.categories = [
                                    ...profile_config.categories,
                                ];
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-6 h-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 19.5V4.5m0 0l3.75 3.75M12 4.5L8.25 8.25"
                                />
                            </svg>
                        </button>
                        <button
                            class="btn btn-primary"
                            aria-label="Move section down"
                            disabled={index ===
                                profile_config.categories.length - 1}
                            onclick={() => {
                                const temp = profile_config.categories[index];
                                profile_config.categories[index] =
                                    profile_config.categories[index + 1];
                                profile_config.categories[index + 1] = temp;
                                profile_config.categories = [
                                    ...profile_config.categories,
                                ];
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-6 h-6"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 4.5v15m0 0l-3.75-3.75M12 19.5l3.75-3.75"
                                />
                            </svg>
                        </button>
                    </div>
                    <button
                        class="btn btn-warning"
                        aria-label="Remove section"
                        onclick={() => removeSection(index)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    {/each}
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
