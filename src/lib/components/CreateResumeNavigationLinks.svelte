<script lang="ts">
    interface CreateResumeNavigationLinksProps {
        profile_id: string;
        active_step: string;
    }

    let { profile_id, active_step }: CreateResumeNavigationLinksProps =
        $props();
</script>

<div class="breadcrumbs text-sm mb-4">
    <ul>
        <li>
            <a
                href={`/create-resume/${profile_id}/personal-info`}
                class:link={active_step === "personal-info"}>Personal Info</a
            >
        </li>
        <li>
            <a href={`/create-resume/${profile_id}/experience`}>Experience</a>
        </li>
        <li>
            <a href={`/create-resume/${profile_id}/education`}> Education </a>
        </li>
        <li>
            <a href={`/create-resume/${profile_id}/projects`}> Projects </a>
        </li>
        <li>
            <a href={`/create-resume/${profile_id}/skills`}> Skills </a>
        </li>
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
