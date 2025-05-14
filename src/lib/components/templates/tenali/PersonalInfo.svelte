<script lang="ts">
    import type { ResumePersonalInfoType } from "@/types/profile";

    interface PersonalInfoProps {
        personal_info: ResumePersonalInfoType;
    }

    let { personal_info }: PersonalInfoProps = $props();
</script>

<header class="header">
    <h1>{personal_info.name || "Your Name"}</h1>
    <div class="contact-info">
        {#if personal_info.phone}
            {personal_info.phone}
        {/if}
        {#if personal_info.email}
            {#if personal_info.phone}
                <span> | </span>
            {/if}
            <a href={`mailto:${personal_info.email}`} class="link"
                >{personal_info.email}</a
            >
        {/if}
        {#each personal_info.title_links as link, i}
            {#if i > 0 || personal_info.phone || personal_info.email}
                <span> | </span>
            {/if}
            <a href={link.url} class="link">{link.title}</a>
        {/each}
    </div>
</header>

<style>
    .header .contact-info {
        font-size: 0.9em;
        /* Approximates \small */
        margin-bottom: 10px;
    }

    .header .contact-info span {
        /* Separator */
        margin: 0 5px;
    }

    .header {
        text-align: center;
        /* margin-bottom: 20px; */
    }

    .header h1 {
        font-size: 2.5em;
        /* Approximates \Huge */
        font-weight: bold;
        /* text-transform: uppercase; */
        /* Approximates \scshape */
        letter-spacing: 1px;
        /* Added spacing for uppercase */
        margin-bottom: 5px;
    }
</style>
