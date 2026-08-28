<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import QuillEditor from "@/components/QuillEditor.svelte";
    import { currentProfile } from "@/global_state.svelte";
    import { updateProfileStep } from "@/utils/index.js";
    import { onMount } from "svelte";

    const currentCategoryIndex =
        currentProfile.data.config.categories.findIndex(
            (category) => category.id === "summary"
        );
    onMount(() => {
        if (currentCategoryIndex === -1) {
            goto(`/create-resume/${currentProfile.data.meta.id}`, {
                invalidateAll: true,
            });
        }
    });

    let summary = $state(currentProfile.data.summary || "");

    let debounceTimeout: ReturnType<typeof setTimeout>;
    function debouncedOnChange() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            currentProfile.data = {
                ...currentProfile.data,
                summary: summary,
            };
            updateProfileStep(currentProfile.data.meta.id, "summary");
        }, 500); // 500ms delay
    }
</script>

<CreateResumeNavigationLinks
    profile_id={currentProfile.data.meta.id}
    categories={currentProfile.data.config.categories}
    active_step="summary"
/>
<p class="text-sm">Hi {currentProfile.data.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">
    Write a summary of your professional experience and skills.
</h2>
<QuillEditor
    bind:value={summary}
    placeholder="Profile Summary"
    onchange={debouncedOnChange}
/>

{#if currentCategoryIndex === currentProfile.data.config.categories.length - 1}
    <a
        href={`/templates/tenali/${currentProfile.data.meta.id}`}
        class="btn btn-primary my-4"
        data-sveltekit-reload
    >
        Preview
    </a>
{:else}
    <a
        href={`/create-resume/${currentProfile.data.meta.id}/${currentProfile.data.config.categories[currentCategoryIndex + 1].id}`}
        class="btn btn-primary my-4"
    >
        Next: {currentProfile.data.config.categories[currentCategoryIndex + 1]
            .name}
    </a>
{/if}
