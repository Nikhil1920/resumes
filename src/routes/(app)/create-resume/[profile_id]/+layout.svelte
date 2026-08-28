<script lang="ts">
    import { cleanupProfileData, currentProfile } from "@/global_state.svelte";

    let { children, data } = $props();

    currentProfile.data = data.profile;

    $effect(() => {
        if (window && window.localStorage) {
            localStorage.setItem(
                currentProfile.data.meta.id,
                JSON.stringify(cleanupProfileData(currentProfile.data))
            );
        }
    });
</script>

{@render children()}
