<script lang="ts">
    import type { ResumeSkillType } from "@/types/profile";

    interface ResumeSkillsInputProps {
        skill: ResumeSkillType;
        removeSkill: () => void;
    }
    let { skill = $bindable(), removeSkill }: ResumeSkillsInputProps = $props();
</script>

<div class="flex">
    <input
        type="text"
        placeholder="Skill Name"
        class="input input-bordered w-full mb-4"
        bind:value={skill.name}
    />
    <button onclick={removeSkill} class="btn btn-error"> Remove </button>
</div>
