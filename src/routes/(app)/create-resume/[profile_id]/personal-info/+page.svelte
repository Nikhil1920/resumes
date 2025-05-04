<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import { defaultResumePersonalInfo } from "@/types/profile";
    import { updateProfileStep } from "@/utils";

    let { data } = $props();
    let personalInfo = $state({
        ...defaultResumePersonalInfo,
        ...data.profile.personal_info,
    });

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                personal_info: personalInfo,
            })
        );
        updateProfileStep(data.profile.meta.id, "experience");
        goto(`/create-resume/${data.profile.meta.id}/experience`, {
            invalidateAll: true,
        });
    };
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="personal-info"
/>

<h1>Enter Your Details</h1>

<form onsubmit={handleSubmit} class="form">
    <fieldset class="fieldset">
        <legend class="fieldset-legend">Name *</legend>
        <input
            type="text"
            class="input"
            placeholder="John Cena"
            required
            bind:value={personalInfo.name}
        />
        <p class="label">Please enter your full name</p>
    </fieldset>

    <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input type="email" class="input" placeholder="jcena@example.com" />
    </fieldset>

    <fieldset class="fieldset">
        <legend class="fieldset-legend">Phone Number</legend>
        <input type="tel" class="input" placeholder="+91 9876543210" />
    </fieldset>

    <button type="submit" class="btn btn-primary">Next: Experience</button>
</form>
