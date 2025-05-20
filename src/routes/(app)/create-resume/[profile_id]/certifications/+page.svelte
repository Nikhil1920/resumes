<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import { updateProfileStep } from "@/utils/index.js";

    let { data } = $props();

    const currentCategoryIndex = data.profile.config.categories.findIndex(
        (category) => category.id === "certifications"
    );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${data.profile.meta.id}`, { invalidateAll: true });
    }

    let certifications = $state(data.profile.certifications || []);

    $effect(() => {
        if (certifications.length === 0) {
            certifications = [""];
        }
        if (certifications[certifications.length - 1] !== "") {
            certifications.push("");
        }
    });

    let debounceTimeout: ReturnType<typeof setTimeout>;
    function debouncedOnChange() {
        clearTimeout(debounceTimeout);
        let cleanedCertifications = certifications
            .map((certification) => certification.trim())
            .filter((certification) => certification !== "");

        debounceTimeout = setTimeout(() => {
            localStorage.setItem(
                data.profile.meta.id,
                JSON.stringify({
                    ...data.profile,
                    certifications: Array.from(new Set(cleanedCertifications)),
                })
            );
            updateProfileStep(data.profile.meta.id, "certifications");
        }, 500); // 500ms delay
    }
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="certifications"
/>
<p class="text-sm">Hi {data.profile.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">
    List your certifications, licenses, and other credentials.
</h2>

{#each certifications as certification, index}
    <div>
        <input
            type="text"
            class="input w-full mb-4"
            bind:value={certifications[index]}
            placeholder="Certification"
            oninput={debouncedOnChange}
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
    <a
        href={`/create-resume/${data.profile.meta.id}/${data.profile.config.categories[currentCategoryIndex + 1].id}`}
        class="btn btn-primary my-4"
    >
        Next: {data.profile.config.categories[currentCategoryIndex + 1].name}
    </a>
{/if}
