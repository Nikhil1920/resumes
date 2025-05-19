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
    let title_links = $state(data.profile.personal_info.title_links);
    let valid_links = $derived(
        title_links.filter((link) => link.title !== "" && link.url !== "")
    );

    $effect(() => {
        if (title_links.length === 0) {
            title_links.push({
                title: "",
                url: "",
            });
        }
        if (title_links[title_links.length - 1].title) {
            title_links.push({
                title: "",
                url: "",
            });
        }
    });

    const updateData = (navigateToNextStep: boolean = false) => {
        let newData = {
            ...personalInfo,
            title_links: valid_links,
        };
        console.log("Updating profile data");
        localStorage.setItem(
            data.profile.meta.id,
            JSON.stringify({
                ...data.profile,
                personal_info: newData,
            })
        );
        if (data.profile.config.categories.length === 0 && navigateToNextStep) {
            goto(`/templates/tenali/${data.profile.meta.id}`, {
                invalidateAll: true,
            });
            return;
        }
        updateProfileStep(
            data.profile.meta.id,
            navigateToNextStep
                ? data.profile.config.categories[0].id
                : "personal-info"
        );
        if (navigateToNextStep) {
            goto(
                `/create-resume/${data.profile.meta.id}/${data.profile.config.categories[0].id}`,
                {
                    invalidateAll: true,
                }
            );
        }
    };

    $effect(() => {
        updateData();
    });
</script>

<CreateResumeNavigationLinks
    profile_id={data.profile.meta.id}
    categories={data.profile.config.categories}
    active_step="personal-info"
/>

<h1 class="text-2xl font-bold mb-4">Enter Your Details</h1>

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

    <h2 class="text-2xl font-bold mb-2 mt-8">Links</h2>
    <p>
        Add links to your linkedin, github, portfolio, or any other relevant
        links. You can add multiple links.
    </p>
    {#each title_links as link, i}
        <ResumeLinkInput
            bind:link={title_links[i]}
            removeEntry={() => {
                confirm(`Are you sure you want to remove entry ${i + 1}?`) &&
                    title_links.splice(i, 1);
            }}
        />
    {/each}

    <div class="flex justify-between my-4">
        {#if data.profile.config.categories.length === 0}
            <a
                href={`/templates/tenali/${data.profile.meta.id}`}
                class="btn btn-primary my-4"
                data-sveltekit-reload
            >
                Preview
            </a>
        {:else}
            <button
                type="button"
                class="btn btn-primary"
                onclick={() => {
                    updateData(true);
                }}
            >
                Next: {data.profile.config.categories[0].name}
            </button>
        {/if}
        <a
            href={"/create-resume/" + data.profile.meta.id}
            class="btn btn-secondary"
        >
            Configure Your Resume
        </a>
    </div>
</div>
