<script lang="ts">
    import { goto } from "$app/navigation";
    import CreateResumeNavigationLinks from "@/components/CreateResumeNavigationLinks.svelte";
    import ResumeLinkInput from "@/components/ResumeLinkInput.svelte";
    import {
        defaultResumePersonalInfo,
        type ResumePersonalInfoType,
    } from "@/types/profile";
    import { updateProfileName, updateProfileStep } from "@/utils";

    let { data } = $props();
    let personalInfo = $state({
        ...defaultResumePersonalInfo,
        ...data.profile.personal_info,
    });

    $effect(() => {
        if (personalInfo.title_links.length === 0) {
            personalInfo.title_links.push({
                title: "",
                url: "",
            });
        }
        if (
            personalInfo.title_links[personalInfo.title_links.length - 1].title
        ) {
            personalInfo.title_links.push({
                title: "",
                url: "",
            });
        }
    });

    const updateData = (
        newData: ResumePersonalInfoType,
        navigateToNextStep: boolean = false
    ) => {
        let validLinks = newData.title_links.filter(
            (link) => link.title !== "" && link.url !== ""
        );
        newData.title_links = validLinks;
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                personal_info: newData,
            })
        );
        updateProfileStep(
            data.profile.meta.id,
            navigateToNextStep ? "experience" : "personal-info"
        );
        if (navigateToNextStep) {
            goto(`/create-resume/${data.profile.meta.id}/experience`, {
                invalidateAll: true,
            });
        }
    };

    $effect(() => {
        console.log("Updating personal info");
        updateData({ ...personalInfo });
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    active_step="personal-info"
/>

<h1>Enter Your Details</h1>

<div>
    <fieldset class="fieldset">
        <legend class="fieldset-legend">Name *</legend>
        <input
            type="text"
            class="input"
            placeholder="Ex: John Cena"
            required
            bind:value={personalInfo.name}
            onchange={() => {
                updateProfileName(
                    data.profile.meta.id,
                    personalInfo.name + "'s Resume"
                );
            }}
        />
        <p class="label">Please enter your full name</p>
    </fieldset>

    <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input
            type="email"
            class="input"
            placeholder="Ex: jcena@example.com"
            bind:value={personalInfo.email}
        />
    </fieldset>

    <fieldset class="fieldset">
        <legend class="fieldset-legend">Phone Number</legend>
        <input
            type="tel"
            class="input"
            placeholder="Ex: +91 9876543210"
            bind:value={personalInfo.phone}
        />
    </fieldset>

    {#each personalInfo.title_links as link, i}
        <ResumeLinkInput
            bind:link={personalInfo.title_links[i]}
            removeEntry={() => {
                confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                    personalInfo.title_links.splice(i, 1);
            }}
        />
    {/each}

    <button
        type="button"
        class="btn btn-primary mt-4"
        onclick={() => {
            updateData(personalInfo, true);
        }}
    >
        Next: Experience
    </button>
</div>
