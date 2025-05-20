<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeSkillCategoryInput from "@/components/ResumeSkillCategoryInput.svelte";
    import ResumeSkillInput from "@/components/ResumeSkillInput.svelte";
    import { defaultResumeSkill, type ResumeSkillType } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();

    const currentCategoryIndex = data.profile.config.categories.findIndex(
        (category) => category.id === "skills"
    );
    if (currentCategoryIndex === -1) {
        goto(`/create-resume/${data.profile.meta.id}`, { invalidateAll: true });
    }

    let skill_categories = $state(
        Array.from(
            new Set(data.profile.skills.map((skill) => skill.category))
        ) || []
    );
    let skill_entries = $state(data.profile.skills || []);

    $effect(() => {
        if (skill_entries.length === 0) {
            skill_entries = [defaultResumeSkill];
        }
        if (skill_entries[skill_entries.length - 1].name !== "") {
            skill_entries.push(defaultResumeSkill);
        }
    });

    $effect(() => {
        if (skill_categories.length === 0) {
            skill_categories = [""];
        }
        if (skill_categories[skill_categories.length - 1] !== "") {
            skill_categories.push("");
        }
    });

    const updateData = (navigateToNextStep: boolean = false) => {
        let skills = skill_entries.filter((skill) => skill.name);
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                skills: skills,
            })
        );
        updateProfileStep(data.profile.meta.id, "skills");
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
        skill_entries;
        updateData();
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="skills"
/>
<p class="text-sm">Hi {data.profile.personal_info.name}!</p>
<h2 class="text-2xl font-bold mb-4">
    List your skills, tools, and technologies you are familiar with.
</h2>
<p class="my-4">
    Enter the categories of your skills. For example, Programming Languages,
    Frameworks, Tools, etc. (Optional)
</p>
{#each skill_categories as category, i}
    <ResumeSkillCategoryInput
        bind:category={skill_categories[i]}
        removeEntry={() => {
            confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                skill_categories.splice(i, 1);
        }}
    />
{/each}

<h2 class="mt-2 mb-4">Enter your Skills</h2>
{#each skill_entries as skill, i}
    <ResumeSkillInput
        bind:skill={skill_entries[i]}
        categories={skill_categories}
        removeSkill={() => {
            confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                skill_entries.splice(i, 1);
        }}
    />
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
