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
            {personal_info.phone} <span>|</span>
        {/if}
        {#if personal_info.email}
            <a href={`mailto:${personal_info.email}`}>{personal_info.email}</a>
            <span>|</span>
        {/if}
        {#each personal_info.title_links as link, i}
            <a href={link.url}>{link.title}</a>
            {#if personal_info.title_links.length != i}
                <span>|</span>
            {/if}
        {/each}
    </div>
</header>

<style>
    .header .contact-info {
        font-size: 0.9em;
        /* Approximates \small */
        margin-bottom: 10px;
    }

    .header .contact-info a {
        color: #007bff;
        /* Standard link blue */
        text-decoration: underline;
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
