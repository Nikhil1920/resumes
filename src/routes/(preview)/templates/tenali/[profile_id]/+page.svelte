<script lang="ts">
    import PersonalInfo from "@/components/templates/tenali/PersonalInfo.svelte";
    import Skills from "@/components/templates/tenali/Skills.svelte";
    import SilentPDF from "@/utils/index.js";
    import { Capacitor } from "@capacitor/core";

    let { data } = $props();

    let selectedTitleFont = $state(data.profile.config.title_font || "Cambria");
    let selectedBodyFont = $state(data.profile.config.body_font || "Gill Sans");
    let titleFonts: string[] = [
        "Cambria",
        "Cochin",
        "Georgia",
        "Times",
        "Times New Roman",
        "Arial",
        "Garamond",
        "Gill Sans",
    ];
    let bodyFonts: string[] = [
        "Gill Sans",
        "Gill Sans MT",
        "Calibri",
        "Trebuchet MS",
        "Arial",
        "Garamond",
        "Gill Sans",
    ];

    const updateFontChoices = () => {
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                config: {
                    ...data.profile.config,
                    title_font: selectedTitleFont,
                    body_font: selectedBodyFont,
                },
            })
        );
    };
</script>

<div
    class="print:hidden w-full flex flex-wrap gap-4 justify-around items-center bg-gray-100 p-4"
    id="styled"
>
    <a
        href={`/create-resume/${data.profile.meta.id}/${data.profile.meta.step}`}
        data-sveltekit-preload-data="false"
        class="btn btn-ghost"
    >
        Back
    </a>
    {#if Capacitor.getPlatform() === "web"}
        <button onclick={() => window.print()} class="btn btn-primary">
            Print
        </button>
    {:else}
        <button
            onclick={() =>
                SilentPDF.download({
                    value: `/templates/tenali/${data.profile.meta.id}`,
                })}
            class="btn btn-secondary"
        >
            Download
        </button>
        <button
            onclick={() =>
                SilentPDF.share({
                    value: `/templates/tenali/${data.profile.meta.id}`,
                })}
            class="btn btn-primary"
        >
            Share
        </button>
    {/if}
</div>
<div
    class="print:hidden w-full flex flex-wrap gap-4 justify-around items-center bg-gray-100 p-4"
    id="styled"
>
    <div>
        <label for="title-font-selection" class="text-sm">
            Pick a Font for Titles
        </label>
        <select
            id="title-font-selection"
            name="title-font-selection"
            class="select"
            bind:value={selectedTitleFont}
            onchange={updateFontChoices}
        >
            <option value="" disabled selected> Select Font </option>
            {#each titleFonts as font}
                <option value={font}>
                    {font}
                </option>
            {/each}
        </select>
    </div>
    <div>
        <label for="body-font-selection" class="text-sm">
            Pick a Font for Body
        </label>
        <select
            id="body-font-selection"
            class="select"
            bind:value={selectedBodyFont}
            onchange={updateFontChoices}
        >
            <option value="" disabled selected> Select Font </option>
            {#each bodyFonts as font}
                <option value={font}>
                    {font}
                </option>
            {/each}
        </select>
    </div>
</div>
<div
    class="container"
    style={`
    --title-font: ${selectedTitleFont};
    --body-font: ${selectedBodyFont};
`}
>
    <PersonalInfo personal_info={data.profile.personal_info} />
    {#each data.profile.config.categories as category}
        {#if category.id === "education" && data.profile.education.length > 0}
            <section id="education">
                <h2 class="section-title">{category.name}</h2>
                <ul class="section-list">
                    {#each data.profile.education as education}
                        <li>
                            <div class="subheading">
                                <div>
                                    <span class="title"
                                        >{education.institution}</span
                                    ><br />
                                    <span class="details"
                                        >{education.degree}</span
                                    >
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

        {#if category.id === "experience" && data.profile.experience.length > 0}
            <section id="experience">
                <h2 class="section-title">{category.name}</h2>
                <ul class="section-list">
                    {#each data.profile.experience as experience}
                        <li>
                            <div class="subheading">
                                <div>
                                    <span class="title">{experience.title}</span
                                    ><br />
                                    <span class="details"
                                        >{experience.company}</span
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

        {#if category.id === "projects" && data.profile.projects.length > 0}
            <section id="projects">
                <h2 class="section-title">{category.name}</h2>
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

        {#if category.id === "skills"}
            <Skills
                skills={data.profile.skills}
                section_title={category.name}
            />
        {:else if category.id === "certifications" && data.profile.certifications.length > 0}
            <section id="certifications">
                <h2 class="section-title">{category.name}</h2>
                <div class="description">
                    <ul>
                        {#each data.profile.certifications as certification}
                            <li>
                                {certification}
                            </li>
                        {/each}
                    </ul>
                </div>
            </section>
        {:else if category.id === "awards" && data.profile.awards.length > 0}
            <section id="awards">
                <h2 class="section-title">{category.name}</h2>
                <div class="description">
                    {@html data.profile.awards}
                </div>
            </section>
        {:else if category.id === "languages" && data.profile.languages.length > 0}
            <section id="languages">
                <h2 class="section-title">{category.name}</h2>
                <div class="description">
                    <ul>
                        {#each data.profile.languages as language}
                            <li>
                                {language.proficiency}
                                {language.name}
                            </li>
                        {/each}
                    </ul>
                </div>
            </section>
        {:else if category.id === "summary" && "summary" in data.profile && data.profile.summary.length > 0}
            <section id="summary">
                <h2 class="section-title">{category.name}</h2>
                <div class="description">
                    {@html data.profile.summary}
                </div>
            </section>
        {/if}
    {/each}
</div>

<style>
    .container {
        font-family: var(--body-font), "Gill Sans", "Gill Sans MT", Calibri,
            "Trebuchet MS", sans-serif;
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

    .container :global(.section-title) {
        font-family: var(--title-font), Cambria, Cochin, Georgia, Times,
            "Times New Roman", serif;
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

    .container :global {
        .description p {
            padding-left: 10px;
        }
        .description ul {
            list-style: disc;
            padding-left: 20px;
        }

        em {
            font-style: italic;
        }

        .skills-list ul {
            list-style: none;
            padding-left: 10px;
        }

        .skills-list li {
            font-size: 0.95em;
            margin-bottom: 2px;
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
