<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeSkillInput from "@/components/ResumeSkillInput.svelte";
    import { defaultResumeSkill, type ResumeSkillType } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();

    let skill_entries = $state<ResumeSkillType[]>(data.profile.skills);

    $effect(() => {
        if (skill_entries.length === 0) {
            skill_entries = [defaultResumeSkill];
        }
        if (skill_entries[skill_entries.length - 1].name !== "") {
            skill_entries.push(defaultResumeSkill);
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

Hi {data.profile.personal_info.name}!
<p>Enter your Skills details</p>
{#each skill_entries as skill, i}
    <ResumeSkillInput
        bind:skill={skill_entries[i]}
        removeSkill={() => {
            skill_entries.splice(i, 1);
        }}
    />
{/each}

<button type="button" class="btn btn-primary" onclick={handleSubmit}>
    Next: View Your Resume
</button>
