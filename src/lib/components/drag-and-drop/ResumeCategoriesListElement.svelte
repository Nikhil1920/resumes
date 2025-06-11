<script lang="ts">
    import {
        attachClosestEdge,
        extractClosestEdge,
    } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
    import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
    import {
        draggable,
        dropTargetForElements,
    } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
    import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
    import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
    import DragHandle from "./DragHandle.svelte";
    import DragPreview from "./DragPreview.svelte";

    interface CategoryState {
        type: "idle" | "preview" | "is-dragging" | "is-dragging-over";
        container?: HTMLElement;
        closestEdge?: Edge | null;
    }

    import Portal from "./Portal.svelte";
    import type { ResumeCategoriesType } from "@/types/profile";
    import { get_category_data, is_category_data } from "@/utils";
    import DropIndicator from "./DropIndicator.svelte";

    type Props = {
        category: ResumeCategoriesType;
        removeCategory: (index: number) => void;
        updateCategoryName: (index: number, name: string) => void;
        index: number;
    };
    let { category, removeCategory, updateCategoryName, index }: Props =
        $props();

    let element: HTMLDivElement | undefined;
    const idle: CategoryState = { type: "idle" };
    let state = $state(idle);

    $effect(() => {
        if (element === undefined) return;
        draggable({
            element,
            getInitialData() {
                // return getCategoryData(category)
                return get_category_data(category);
            },
            onGenerateDragPreview({ nativeSetDragImage }) {
                setCustomNativeDragPreview({
                    nativeSetDragImage,
                    getOffset: pointerOutsideOfPreview({
                        x: "16px",
                        y: "8px",
                    }),
                    render({ container }) {
                        state = { type: "preview", container };
                    },
                });
            },
            onDragStart() {
                state = { type: "is-dragging" };
            },
            onDrop() {
                state = idle;
            },
        });

        dropTargetForElements({
            element,
            canDrop({ source }) {
                // not allowing dropping on yourself
                if (source.element === element) {
                    return false;
                }
                // only allowing categorys to be dropped on me
                return is_category_data(source.data);
                // return source.element.hasAttribute('data-category-id')
            },
            getData({ input }) {
                const data = get_category_data(category);
                return attachClosestEdge(data, {
                    element: element!,
                    input,
                    allowedEdges: ["top", "bottom"],
                });
            },
            getIsSticky() {
                return true;
            },
            onDragEnter({ self }) {
                const closestEdge = extractClosestEdge(self.data);
                state = { type: "is-dragging-over", closestEdge };
            },
            onDrag({ self }) {
                const closestEdge = extractClosestEdge(self.data);

                // Only need to update state if nothing has changed.
                // Prevents re-rendering.
                if (
                    state.type !== "is-dragging-over" ||
                    state.closestEdge !== closestEdge
                ) {
                    state = { type: "is-dragging-over", closestEdge };
                }
            },
            onDragLeave() {
                state = idle;
            },
            onDrop() {
                state = idle;
            },
        });
    });
</script>

<div class="relative">
    <div
        class="card bg-base-200 max-w-96 mb-4"
        data-category-id={category.id}
        bind:this={element}
        class:opacity-40={state.type === "is-dragging"}
    >
        <div class="card-body">
            <h3 class="card-title">
                {index + 1}. {category.name}
                <button
                    class=""
                    aria-label="Edit section name"
                    onclick={() => {
                        let new_name = prompt(
                            `Enter new name for ${category.name}`
                        );
                        if (new_name) {
                            updateCategoryName(index, new_name);
                        }
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        class="size-4"
                    >
                        <path
                            d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z"
                        />
                        <path
                            d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"
                        />
                    </svg>
                </button>
            </h3>

            <p>{category.description}</p>
            <div class="card-actions justify-between">
                <!-- Change order -->
                <DragHandle />

                <button
                    class="btn btn-warning"
                    aria-label="Remove section"
                    onclick={() => removeCategory(index)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    <!-- <div
        data-category-id={category.id}
        bind:this={element}
        class:opacity-40={state.type === "is-dragging"}
        class={`flex text-sm bg-white 
                flex-row items-center 
                border border-solid rounded p-2 pl-0 
                hover:bg-slate-100 hover:cursor-grab`}
    >
        <DragHandle />
        <span class="truncate flex-grow flex-shrink">{category.name}</span>
    </div> -->

    {#if state.type === "is-dragging-over" && state.closestEdge}
        <DropIndicator edge={state.closestEdge} gap={"8px"} />
    {/if}
</div>
{#if state.type === "preview"}
    <Portal target={state.container}>
        <DragPreview {category} />
    </Portal>
{/if}
