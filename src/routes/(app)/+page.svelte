<script lang="ts">
    import { Capacitor } from "@capacitor/core";
    import { goto } from "$app/navigation";
    import {
        defaultProfile,
        defaultProfileMetaData,
        type ProfileMetaDataType,
    } from "@/types/profile";
    import { generateProfileId } from "@/utils";
    import { onMount } from "svelte";

    let profiles: ProfileMetaDataType[] = $state([]);

    onMount(() => {
        let profilesString = localStorage.getItem("profiles");
        if (!profilesString) {
            localStorage.setItem("profiles", JSON.stringify([]));
            profilesString = "[]";
        }

        profiles = JSON.parse(profilesString);
    });

    const createNewResume = () => {
        let profilesString = localStorage.getItem("profiles");
        if (!profilesString) {
            profilesString = "[]";
            localStorage.setItem("profiles", JSON.stringify(profilesString));
        }

        const profiles: ProfileMetaDataType[] = JSON.parse(profilesString);
        const newId = generateProfileId();
        localStorage.setItem(
            "profiles",
            JSON.stringify([
                ...profiles,
                { ...defaultProfileMetaData, id: newId },
            ])
        );
        localStorage.setItem(
            newId,
            JSON.stringify({
                ...defaultProfile,
                meta: { ...defaultProfile.meta, id: newId },
            })
        );
        goto(`/create-resume/${newId}/personal-info`);
    };
</script>

<h1 class="font-bold text-4xl mb-8">Welcome to Resume Maker 9000</h1>

<div class="flex flex-col gap-4">
    <button onclick={createNewResume} class="btn btn-primary">
        Create New Resume
    </button>

    {#if profiles.length > 0}
        <h2 class="font-semibold text-2xl">Saved Profiles</h2>
        {#each profiles as profile}
            <div class="card card-border bg-base-200 max-w-96">
                <div class="card-body">
                    <h2 class="card-title">{profile.name || "Unnamed"}</h2>
                    <p>
                        {profile.description}
                        <br />
                        <strong>Last Updated</strong>: {new Date(
                            profile.last_updated
                        ).toLocaleString()}
                    </p>
                    <div class="card-actions justify-end">
                        <a
                            href={`/create-resume/${profile.id}/${profile.step}`}
                            class="btn btn-primary">View</a
                        >
                    </div>
                </div>
            </div>
        {/each}
    {/if}
</div>

<div class="mt-8">
    <h2 class="font-semibold text-2xl">How to use Resume Maker 9000</h2>
    <ul class="list-disc list-outside ms-4 mt-4">
        <li>
            Click on the "Create New Resume" button to start creating your
            resume.
        </li>
        <li>Fill the fields relevant to you under each section.</li>
        <li>
            After you have entered your information under all the sections, A
            preview of your resume will be shown.
        </li>
        {#if Capacitor.getPlatform() === "web"}
            <li>Click on the "Print" button to print your resume.</li>
            <li>
                In the print dialog, select "Save as PDF" as the printer and
                click "Print" to save your resume as a PDF file.
            </li>
            <li>
                Or download the mobile app available for Android and iOS for a
                seamless PDF generation experience.
            </li>
        {:else}
            <li>
                Click on the "Download" button to download your resume in PDF
                format.
            </li>
            <li>
                Click on the "Share" button to share your resume with others.
            </li>
        {/if}
    </ul>
</div>
{#if Capacitor.getPlatform() === "web"}
    <div class="flex flex-col mt-8">
        <h2 class="font-semibold text-2xl">
            Download the mobile app available for Android and iOS
        </h2>
        <div class="flex flex-wrap gap-4 mt-4">
            <a
                href="https://apps.apple.com/us/app/resume-maker-9000-pdf-cvs/id6745529858"
                aria-label="Download Resume Maker 9000 from AppStore"
            >
                <img
                    src="/app-store-badge-dark.svg"
                    alt="Get Resume Maker 9000 on App Store"
                    class="h-20"
                />
            </a>
            <a
                href="https://play.google.com/store/apps/details?id=com.byanr.resumes"
                aria-label="Download Resume Maker 9000 from PlayStore"
            >
                <img
                    src="/play-store-badge.svg"
                    alt="Get Resume Maker 9000 on Google Play"
                    class="h-20"
                />
            </a>
        </div>
    </div>
    <div class="mt-8">
        <h2 class="font-bold text-2xl">Why choose Resume Maker 9000</h2>
        <ul class="list-disc list-outside ms-4 space-y-1 mt-4">
            <li>
                <span class="font-semibold">Secure & Private:</span>
                Your data stays on your device, no storage or sharing of personal
                information.
            </li>
            <li>
                <span class="font-semibold">Effortless Resume Creation:</span> Build
                a professional resume in under 5 minutes with our guided form.
            </li>
            <li>
                <span class="font-semibold">Completely Free & Unlimited:</span> Generate
                as many resumes as you need without any hidden fees or premium tiers.
            </li>
            <li>
                <span class="font-semibold">Designed for Developers:</span> Access
                industry-leading templates tailored for software engineers, programmers,
                and tech experts.
            </li>
            <li>
                <span class="font-semibold">PDF Export for Easy Sharing:</span> Download
                high-quality PDF of your resume that you can easily share.
            </li>
            <li>
                <span class="font-semibold">
                    ATS-Friendly Resume Templates
                </span>
            </li>
            <li>
                <span class="font-semibold">No Account Needed:</span> Start building
                your resume instantly without sign-ups or delays.
            </li>
            <li>
                <span class="font-semibold">Simple Interface:</span> Focus on showcasing
                your skills with an intuitive and user-friendly design.
            </li>
            <li>
                <span class="font-semibold">100% Free:</span> Enjoy unlimited resume
                generations and downloads at no cost—no subscriptions or hidden fees.
            </li>
        </ul>
    </div>
{/if}
