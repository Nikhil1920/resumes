<script lang="ts">
    import type { ResumeCategoriesType } from "@/types/profile";

    type Props = {
        category: ResumeCategoriesType;
    };
    let { category }: Props = $props();
</script>

<div class="border-solid rounded p-2 bg-white">{category.name}</div>
