<script lang="ts">
    import type { ResumeCategoriesType } from "@/types/profile";
    import { is_category_data } from "@/utils";
    import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";
    import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
    import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
    import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
    import ResumeCategoriesListElement from "./ResumeCategoriesListElement.svelte";

    type Props = {
        categories: ResumeCategoriesType[];
    };

    let { categories = $bindable() }: Props = $props();

    const removeCategory = (index: number) => {
        categories.splice(index, 1);
    };
    const updateCategoryName = (index: number, name: string) => {
        categories[index].name = name;
    };

    $effect(() => {
        return monitorForElements({
            canMonitor({ source }) {
                return is_category_data(source.data);
            },
            onDrop({ location, source }) {
                const target = location.current.dropTargets[0];
                if (!target) {
                    return;
                }

                const sourceData = source.data;
                const targetData = target.data;

                if (
                    !is_category_data(sourceData) ||
                    !is_category_data(targetData)
                ) {
                    return;
                }

                const indexOfSource = categories.findIndex(
                    (task) => task.id === sourceData.categoryId
                );
                const indexOfTarget = categories.findIndex(
                    (task) => task.id === targetData.categoryId
                );

                if (indexOfTarget < 0 || indexOfSource < 0) {
                    return;
                }

                const closestEdgeOfTarget = extractClosestEdge(targetData);

                categories = reorderWithEdge({
                    list: categories,
                    startIndex: indexOfSource,
                    indexOfTarget,
                    closestEdgeOfTarget,
                    axis: "vertical",
                });
                const element = document.querySelector(
                    `[data-task-id="${sourceData.categoryId}"]`
                );
                if (element instanceof HTMLElement) {
                    triggerPostMoveFlash(element);
                }
            },
        });
    });
</script>

<div class="flex flex-col gap-2">
    {#each categories as category, index}
        <ResumeCategoriesListElement
            {category}
            {index}
            {removeCategory}
            {updateCategoryName}
        />
    {/each}
</div>
