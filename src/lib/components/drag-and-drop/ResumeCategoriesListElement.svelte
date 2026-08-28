<script lang="ts">
    import {
        attachClosestEdge,
        extractClosestEdge,
    } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
    import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
    import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
    import {
        draggable,
        dropTargetForElements,
    } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

    interface CategoryState {
        type: "idle" | "preview" | "is-dragging" | "is-dragging-over";
        container?: HTMLElement;
        closestEdge?: Edge | null;
    }

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
    let dnd_state = $state(idle);

    $effect(() => {
        if (element === undefined) return;

        return combine(
            draggable({
                element,
                getInitialData() {
                    return get_category_data(category);
                },
                onDragStart() {
                    dnd_state = { type: "is-dragging" };
                },
                onDrop() {
                    dnd_state = idle;
                },
            }),
            dropTargetForElements({
                element,
                canDrop({ source }) {
                    // not allowing dropping on yourself
                    if (source.element === element) {
                        return false;
                    }
                    // only allowing categorys to be dropped on me
                    return is_category_data(source.data);
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
                    dnd_state = { type: "is-dragging-over", closestEdge };
                },
                onDrag({ self }) {
                    const closestEdge = extractClosestEdge(self.data);

                    // Only need to update dnd_state if nothing has changed.
                    // Prevents re-rendering.
                    if (
                        dnd_state.type !== "is-dragging-over" ||
                        dnd_state.closestEdge !== closestEdge
                    ) {
                        dnd_state = { type: "is-dragging-over", closestEdge };
                    }
                },
                onDragLeave() {
                    dnd_state = idle;
                },
                onDrop() {
                    dnd_state = idle;
                },
            })
        );
    });
</script>

<div class="relative">
    <div
        class="card bg-base-200 max-w-96 mb-4"
        data-category-id={category.id}
        bind:this={element}
        class:opacity-40={dnd_state.type === "is-dragging"}
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
                <button
                    aria-label="drag"
                    style="cursor: grab;"
                    class="btn btn-neutral"
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
                            d="M9 5C9.82843 5 10.5 5.67157 10.5 6.5C10.5 7.32843 9.82843 8 9 8C8.17157 8 7.5 7.32843 7.5 6.5C7.5 5.67157 8.17157 5 9 5Z"
                            fill="#202945"
                        />
                        <path
                            d="M9 10.5C9.82843 10.5 10.5 11.1716 10.5 12C10.5 12.8284 9.82843 13.5 9 13.5C8.17157 13.5 7.5 12.8284 7.5 12C7.5 11.1716 8.17157 10.5 9 10.5Z"
                            fill="#202945"
                        />
                        <path
                            d="M10.5 17.5C10.5 16.6716 9.82843 16 9 16C8.17157 16 7.5 16.6716 7.5 17.5C7.5 18.3284 8.17157 19 9 19C9.82843 19 10.5 18.3284 10.5 17.5Z"
                            fill="#202945"
                        />
                        <path
                            d="M15 5C15.8284 5 16.5 5.67157 16.5 6.5C16.5 7.32843 15.8284 8 15 8C14.1716 8 13.5 7.32843 13.5 6.5C13.5 5.67157 14.1716 5 15 5Z"
                            fill="#202945"
                        />
                        <path
                            d="M15 10.5C15.8284 10.5 16.5 11.1716 16.5 12C16.5 12.8284 15.8284 13.5 15 13.5C14.1716 13.5 13.5 12.8284 13.5 12C13.5 11.1716 14.1716 10.5 15 10.5Z"
                            fill="#202945"
                        />
                        <path
                            d="M16.5 17.5C16.5 16.6716 15.8284 16 15 16C14.1716 16 13.5 16.6716 13.5 17.5C13.5 18.3284 14.1716 19 15 19C15.8284 19 16.5 18.3284 16.5 17.5Z"
                            fill="#202945"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    {#if dnd_state.type === "is-dragging-over" && dnd_state.closestEdge}
        <DropIndicator edge={dnd_state.closestEdge} gap={"8px"} />
    {/if}
</div>
