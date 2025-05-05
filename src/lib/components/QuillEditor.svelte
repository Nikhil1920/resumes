<script lang="ts">
    import { onMount } from "svelte";
    import Quill from "quill";
    import "quill/dist/quill.snow.css";
    let quill: Quill;
    let editor: HTMLDivElement;

    type Props = {
        value?: string | null;
        placeholder?: string;
    };

    let { value = $bindable(), placeholder }: Props = $props();

    let internal = value;

    function onTextChange() {
        value = internal = quill.getSemanticHTML(); // set internal
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

    onMount(() => {
        quill = new Quill(editor, {
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

        quill.on("text-change", onTextChange);

        return () => {
            quill.off("text-change", onTextChange);
        };
    });
</script>

<div class="editor-wrapper">
    <div bind:this={editor}></div>
</div>

<style>
    @media (prefers-color-scheme: dark) {
        .editor-wrapper {
            background-color: white;
            color: black;
        }
    }
</style>
