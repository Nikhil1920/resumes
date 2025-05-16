<script lang="ts">
    const baseUrl = "https://resumes.byanr.com";

    interface SEOProps {
        title?: string;
        description?: string;
        canonical?: string;
    }

    let { title, description, canonical }: SEOProps = $props();
</script>

<svelte:head>
    {#if title}
        <title>{title}</title>
        <meta property="og:title" content={title} />
    {/if}
    {#if description}
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
    {/if}
    {#if canonical !== undefined}
        <meta property="og:url" content={baseUrl + canonical} />
        <link rel="canonical" href={baseUrl + canonical} />
    {/if}
</svelte:head>
