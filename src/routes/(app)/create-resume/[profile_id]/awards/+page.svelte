<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import QuillEditor from "@/components/QuillEditor.svelte";
    import { updateProfileStep } from "@/utils/index.js";

    let { data } = $props();

    const currentCategoryIndex = data.profile.config.categories.findIndex(
        (category) => category.id === "awards"
    );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${data.profile.meta.id}`, { invalidateAll: true });
    }

    let awards = $state(
        data.profile.awards ? data.profile.awards : "<ul><li></li></ul>"
    );

    let debounceTimeout: ReturnType<typeof setTimeout>;
    function debouncedOnChange() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            let cleanedAwards = awards.trim();
            if (["<ul><li></li></ul>", "<p></p>"].includes(cleanedAwards)) {
                cleanedAwards = "";
            }
            localStorage.setItem(
                data.profile.meta.id,
                JSON.stringify({
                    ...data.profile,
                    awards: cleanedAwards,
                })
            );
            updateProfileStep(data.profile.meta.id, "awards");
        }, 500); // 500ms delay
    }
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="awards"
/>
<p class="text-sm">Hi {data.profile.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">
    List your awards, honors, and other recognitions.
</h2>

<QuillEditor
    bind:value={awards}
    placeholder="Example: Best Employee of the Year 2022"
    onchange={debouncedOnChange}
/>

{#if currentCategoryIndex === data.profile.config.categories.length - 1}
    <a
        href={`/templates/tenali/${data.profile.meta.id}`}
        class="btn btn-primary my-4"
        data-sveltekit-reload
    >
        Preview
    </a>
{:else}
    <a
        href={`/create-resume/${data.profile.meta.id}/${data.profile.config.categories[currentCategoryIndex + 1].id}`}
        class="btn btn-primary my-4"
    >
        Next: {data.profile.config.categories[currentCategoryIndex + 1].name}
    </a>
{/if}
