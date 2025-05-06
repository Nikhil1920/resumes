<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeSkillCategoryInput from "@/components/ResumeSkillCategoryInput.svelte";
    import ResumeSkillInput from "@/components/ResumeSkillInput.svelte";
    import { defaultResumeSkill, type ResumeSkillType } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();

    let skill_categories = $state<string[]>(
        Array.from(new Set(data.profile.skills.map((skill) => skill.category)))
    );
    let skill_entries = $state<ResumeSkillType[]>(data.profile.skills);

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

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        let skills = skill_entries.filter((skill) => skill.name);
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                skills: skills,
            })
        );
        updateProfileStep(data.profile.meta.id, "skills");
        goto(`/templates/tenali/${data.profile.meta.id}`, {
            invalidateAll: true,
        });
    };
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="skills"
/>
<h1>
    Hi {data.profile.personal_info.name}!
</h1>
<h2>Enter your Skills Categories below</h2>
{#each skill_categories as category, i}
    <ResumeSkillCategoryInput
        bind:category={skill_categories[i]}
        removeEntry={() => {
            skill_categories.splice(i, 1);
        }}
    />
{/each}

<h2 class="mt-2 mb-4">Enter your Skills details</h2>
{#each skill_entries as skill, i}
    <ResumeSkillInput
        bind:skill={skill_entries[i]}
        categories={skill_categories}
        removeSkill={() => {
            skill_entries.splice(i, 1);
        }}
    />
{/each}

<button type="button" class="btn btn-primary" onclick={handleSubmit}>
    Next: View Your Resume
</button>
