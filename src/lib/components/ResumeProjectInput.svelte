<script lang="ts">
    import type { ResumeProjectType } from "@/types/profile";

    interface ResumeProjectInputProps {
        project: ResumeProjectType;
        removeEntry: () => void;
    }
    let { project = $bindable(), removeEntry }: ResumeProjectInputProps =
        $props();
</script>

<div class="card">
    <div class="card-body">
        <input
            type="text"
            placeholder="Project Name"
            class="input input-bordered w-full mb-4"
            bind:value={project.title}
        />
        <textarea
            placeholder="Description"
            class="textarea textarea-bordered w-full mb-4"
            bind:value={project.description}
        ></textarea>
        <input
            type="text"
            placeholder="Start Date"
            class="input input-bordered w-full mb-4"
            bind:value={project.start_date}
        />
        <input
            type="text"
            placeholder="End Date"
            class="input input-bordered w-full mb-4"
            bind:value={project.end_date}
        />
        <div class="card-actions justify-end">
            <button class="btn btn-warning" onclick={removeEntry}>
                Remove
            </button>
        </div>
    </div>
</div>
