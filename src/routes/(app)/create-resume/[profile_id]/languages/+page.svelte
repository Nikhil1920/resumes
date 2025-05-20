<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import { updateProfileStep } from "@/utils/index.js";

    let { data } = $props();

    const currentCategoryIndex = data.profile.config.categories.findIndex(
        (category) => category.id === "languages"
    );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${data.profile.meta.id}`, { invalidateAll: true });
    }

    let languages = $state(data.profile.languages || []);

    $effect(() => {
        if (languages.length === 0) {
            languages = [
                {
                    name: "",
                    proficiency: "Basic",
                },
            ];
        }
        if (languages[languages.length - 1].name !== "") {
            languages.push({
                name: "",
                proficiency: "Basic",
            });
        }
    });

    let debounceTimeout: ReturnType<typeof setTimeout>;
    function debouncedOnChange() {
        clearTimeout(debounceTimeout);
        let knownLanguages: string[] = [];
        let cleanedLanguages = languages
            .map((language) => {
                return {
                    name: language.name.trim(),
                    proficiency: language.proficiency,
                };
            })
            .filter((language) => {
                if (language.name !== "") {
                    if (!knownLanguages.includes(language.name)) {
                        knownLanguages.push(language.name);
                        return true;
                    }
                    return false;
                }
                return false;
            });
        cleanedLanguages = Array.from(new Set(cleanedLanguages));
        debounceTimeout = setTimeout(() => {
            localStorage.setItem(
                data.profile.meta.id,
                JSON.stringify({
                    ...data.profile,
                    languages: cleanedLanguages,
                })
            );
            updateProfileStep(data.profile.meta.id, "languages");
        }, 500); // 500ms delay
    }
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="languages"
/>
<p class="text-sm">Hi {data.profile.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">
    List your languages, licenses, and other credentials.
</h2>

{#each languages as language, index}
    <div class="mb-4 flex flex-row gap-2">
        <input
            type="text"
            class="input"
            bind:value={languages[index].name}
            placeholder="Language"
            oninput={debouncedOnChange}
        />
        <select
            class="select"
            bind:value={languages[index].proficiency}
            oninput={debouncedOnChange}
        >
            <option value="Basic">Basic</option>
            <option value="Conversational">Conversational</option>
            <option value="Proficient">Proficient</option>
            <option value="Fluent">Fluent</option>
        </select>
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
