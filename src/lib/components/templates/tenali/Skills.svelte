<script lang="ts">
    import type { ResumeSkillType } from "@/types/profile";

    interface SkillsProps {
        skills: ResumeSkillType[];
        section_title: string;
    }

    let { skills, section_title }: SkillsProps = $props();
    let categories: string[] = [];
    let categoryWiseSkills: { [key: string]: ResumeSkillType[] } = {};
    skills.forEach((skill) => {
        if (!categories.includes(skill.category)) {
            categories.push(skill.category);
            categoryWiseSkills[skill.category] = [];
        }
        categoryWiseSkills[skill.category].push(skill);
    });
</script>

{#if skills.length > 0}
    <section id="skills" class="skills-list">
        <h2>{section_title}</h2>
        <ul>
            {#each categories as category}
                <li>
                    {#if category}
                        <strong>{category}</strong>:{" "}
                    {/if}
                    {categoryWiseSkills[category]
                        .map((skill) => skill.name)
                        .join(", ")}
                </li>
            {/each}
        </ul>
    </section>
{/if}

<style>
    .skills-list ul {
        list-style: none;
        padding-left: 10px;
    }

    .skills-list li {
        font-size: 0.95em;
        margin-bottom: 2px;
    }
</style>
