<script lang="ts">
    import type { ResumeExperienceType } from "@/types/profile";
    import QuillEditor from "./QuillEditor.svelte";

    interface ResumeExperienceInputProps {
        experience: ResumeExperienceType;
        removeEntry: () => void;
    }
    let { experience = $bindable(), removeEntry }: ResumeExperienceInputProps =
        $props();
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
        <QuillEditor bind:value={experience.description} />
        <div class="card-actions justify-end">
            <button class="btn btn-warning" onclick={removeEntry}>
                Remove
            </button>
        </div>
    </div>
</div>
