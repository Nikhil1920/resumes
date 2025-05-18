<script lang="ts">
    import type { ResumeCategoriesType } from "@/types/profile";

    interface CreateResumeNavigationLinksProps {
        profile_id: string;
        active_step: string;
        categories: ResumeCategoriesType[];
    }

    let {
        profile_id,
        active_step,
        categories,
    }: CreateResumeNavigationLinksProps = $props();
</script>

<div class="breadcrumbs text-sm mb-4">
    <ul>
        <li>
            <a
                href={`/create-resume/${profile_id}/personal-info`}
                class:link={active_step === "personal-info"}>Personal Info</a
            >
        </li>
        {#each categories as category}
            <li>
                <a
                    href={`/create-resume/${profile_id}/${category.id}`}
                    class:link={active_step === category.id}>{category.name}</a
                >
            </li>
        {/each}
        <li>
            <a
                href={`/templates/tenali/${profile_id}`}
                data-sveltekit-reload="true"
            >
                Preview
            </a>
        </li>
    </ul>
</div>
