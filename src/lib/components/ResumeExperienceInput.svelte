<script lang="ts">
    import type { ResumeExperienceType } from "@/types/profile";

    interface ResumeExperienceInputProps {
        experience: ResumeExperienceType;
    }
    let { experience = $bindable() }: ResumeExperienceInputProps = $props();
</script>

<div class="card">
    <div class="card-body">
        <input
            type="text"
            placeholder="Company Name"
            class="input input-bordered w-full mb-4"
            bind:value={experience.company}
        />
        <input
            type="text"
            placeholder="Job Title"
            class="input input-bordered w-full mb-4"
            bind:value={experience.title}
        />
        <input
            type="text"
            placeholder="Location"
            class="input input-bordered w-full mb-4"
            bind:value={experience.location}
        />
        <input
            type="text"
            placeholder="Start Date"
            class="input input-bordered w-full mb-4"
            bind:value={experience.start_date}
        />
        <input
            type="text"
            placeholder="End Date"
            class="input input-bordered w-full mb-4"
            bind:value={experience.end_date}
        />
    </div>
</div>
