<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import "quill/dist/quill.snow.css";
    let editor: HTMLDivElement;

    type Props = {
        value?: string | null;
        placeholder?: string;
        onchange?: (value: string) => void;
    };

    let { value = $bindable(), placeholder, onchange }: Props = $props();

    let internal = value;

    onMount(async () => {
        const { default: Quill } = await import("quill");
        let quill = new Quill(editor, {
            modules: {
                toolbar: [
                    [{ list: "bullet" }],
                    ["bold", "italic", "underline", "strike"],
                    ["link"],
                ],
            },
            placeholder: placeholder,
            theme: "snow",
        });

        const delta = quill.clipboard.convert({ html: value || "" });
        quill.setContents(delta);

        function onTextChange() {
            if (!quill) return;
            value = internal = quill.getSemanticHTML(); // set internal
            onchange?.(value); // call onchange
        }

        $effect(() => {
            if (quill && value !== internal) {
                // check if value !== internal
                console.log("value", value);
                console.log("internal", internal);
                internal = value || "";
                const delta = quill.clipboard.convert({ html: value || "" });
                quill.setContents(delta);
            }
        });

        quill.on("text-change", onTextChange);

        onDestroy(() => {
            if (quill) {
                quill.off("text-change", onTextChange);
            }
        });
    });
</script>

<div class="editor-wrapper mb-4">
    <div bind:this={editor}></div>
</div>

<style>
    @media (prefers-color-scheme: dark) {
        .editor-wrapper {
            background-color: white;
            color: black;
        }
    }

    .editor-wrapper :global {
        .ql-editor {
            min-height: 100px;
            max-height: 200px;
        }
        .ql-tooltip {
            z-index: 9999;
        }
    }
</style>
