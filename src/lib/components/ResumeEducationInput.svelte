<script lang="ts">
    import type { ResumeEducationType } from "@/types/profile";
    import QuillEditor from "./QuillEditor.svelte";

    interface ResumeEducationInputProps {
        education: ResumeEducationType;
        removeEntry: () => void;
    }
    let { education = $bindable(), removeEntry }: ResumeEducationInputProps =
        $props();
</script>

<div class="my-4">
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
    <QuillEditor placeholder="Description" bind:value={education.description}
    ></QuillEditor>
    <div class="flex justify-end my-2">
        <button class="btn btn-warning" onclick={removeEntry}>Remove</button>
    </div>
</div>
