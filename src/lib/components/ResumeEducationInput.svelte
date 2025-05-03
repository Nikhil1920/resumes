<script lang="ts">
    import type { ResumeEducationType } from "@/types/profile";

    interface ResumeEducationInputProps {
        education: ResumeEducationType;
    }
    let { education = $bindable() }: ResumeEducationInputProps = $props();
</script>

<div class="card">
    <div class="card-body">
        <input
            type="text"
            placeholder="Institution Name"
            class="input input-bordered w-full mb-4"
            bind:value={education.institution}
        />
        <input
            type="text"
            placeholder="Degree"
            class="input input-bordered w-full mb-4"
            bind:value={education.degree}
        />
        <input
            type="text"
            placeholder="Start Date"
            class="input input-bordered w-full mb-4"
            bind:value={education.start_date}
        />
        <input
            type="text"
            placeholder="End Date"
            class="input input-bordered w-full mb-4"
            bind:value={education.end_date}
        />
        <textarea
            placeholder="Description"
            class="textarea textarea-bordered w-full mb-4"
            bind:value={education.description}
        ></textarea>
    </div>
</div>
