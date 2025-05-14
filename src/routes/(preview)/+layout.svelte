<script lang="ts">
    let { children } = $props();

    import "./preview.css";
</script>

<div data-theme="light">
    {@render children()}
</div>
