<script lang="ts">
    import PersonalInfo from "@/components/templates/tenali/PersonalInfo.svelte";
    import Skills from "@/components/templates/tenali/Skills.svelte";

    let { data } = $props();
</script>

<div
    class="print:hidden w-full flex justify-around items-center bg-gray-100 p-4"
    id="styled"
>
    <button onclick={() => window.print()} class="btn btn-primary">
        Print
    </button>
</div>
<div class="container">
    <PersonalInfo personal_info={data.profile.personal_info} />
    {#if data.profile.education.length > 0}
        <section id="education">
            <h2>Education</h2>
            <ul class="section-list">
                {#each data.profile.education as education}
                    <li>
                        <div class="subheading">
                            <div>
                                <span class="title"
                                    >{education.institution}</span
                                ><br />
                                <span class="details">{education.degree}</span>
                            </div>
                            <div class="location-date">
                                {education.location}<br />
                                <span class="details"
                                    >{education.start_date}
                                    {#if education.end_date}
                                        - {education.end_date}
                                    {/if}</span
                                >
                            </div>
                        </div>
                    </li>
                {/each}
            </ul>
        </section>
    {/if}

    {#if data.profile.experience.length > 0}
        <section id="experience">
            <h2>Experience</h2>
            <ul class="section-list">
                {#each data.profile.experience as experience}
                    <li>
                        <div class="subheading">
                            <div>
                                <span class="title">{experience.title}</span><br
                                />
                                <span class="details">{experience.company}</span
                                >
                            </div>
                            <div class="location-date">
                                {experience.start_date}
                                {#if experience.end_date}
                                    - {experience.end_date}
                                {/if}<br />
                                <span class="details"
                                    >{experience.location}</span
                                >
                            </div>
                        </div>

                        {#if experience.description}
                            <div class="description">
                                {@html experience.description}
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
        </section>
    {/if}

    {#if data.profile.projects.length > 0}
        <section id="projects">
            <h2>Projects</h2>
            <ul class="section-list">
                {#each data.profile.projects as project}
                    <li>
                        <div class="project-heading">
                            <div>
                                <span class="title">{project.title}</span>
                                {#if project.skills.length > 0}
                                    | <span class="tech"
                                        >{#each project.skills as skill, i}
                                            {skill}
                                            {#if project.skills.length != i + 1}
                                                ,
                                            {/if}
                                        {/each}
                                    </span>
                                {/if}
                            </div>
                            {#if project.start_date || project.end_date}
                                <div class="dates">
                                    {project.start_date}
                                    {#if project.end_date}
                                        - {project.end_date}
                                    {/if}
                                </div>
                            {/if}
                        </div>
                        {#if project.description}
                            <div class="description">
                                {@html project.description}
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
        </section>
    {/if}

    <Skills skills={data.profile.skills} />
</div>

<style>
    .container {
        /* font-family: sans-serif; */
        /* Changed from default serif for better screen readability */
        /* line-height: 1.4; */
        margin: 40px auto;
        /* Added auto margin for centering */
        max-width: 216mm;
        /* Constrained width */
        padding: 0 20px;
        font-size: 11pt;
        /* Added padding */
        color: #333;
    }

    .container :global(section) {
        margin-bottom: 10px;
    }

    .container :global(section h2) {
        font-size: 1.2em;
        font-weight: bold;
        text-transform: capitalize;
        /* Approximates \scshape */
        letter-spacing: 1px;
        /* Added spacing for uppercase */
        border-bottom: 1px solid black;
        padding-bottom: 2px;
        margin-bottom: 5px;
    }

    ul.section-list {
        list-style: none;
        padding-left: 10px;
    }

    ul.section-list > li {
        margin-bottom: 8px;
        /* Space between entries */
    }

    .subheading {
        display: flex;
        justify-content: space-between;
        /* margin-bottom: 5px; */
        /* Space before bullet points */
    }

    .subheading .title {
        font-weight: bold;
    }

    .subheading .location-date {
        text-align: right;
        /* Aligns dates/locations to the right */
    }

    .subheading .details {
        font-style: italic;
        font-size: 0.9em;
        /* Approximates \small */
        color: #555;
        /* Slightly lighter text for details */
    }

    .description {
        padding-left: 20px;
    }

    .container :global {
        .description ul {
            list-style: disc;
        }

        em {
            font-style: italic;
        }
    }

    /* Specific styling for Project headings which combine bold and italic */
    .project-heading {
        display: flex;
        justify-content: space-between;
        /* margin-bottom: 5px; */
        font-size: 0.95em;
        /* Approximates \small */
    }

    .project-heading .title {
        font-weight: bold;
    }

    .project-heading .tech {
        font-style: italic;
        color: #555;
    }

    .project-heading .dates {
        text-align: right;
        white-space: nowrap;
        /* Prevent dates wrapping */
        padding-left: 10px;
        /* Space between tech and dates */
    }
</style>
