<script lang="ts">
    import "../../app.css";

    let { children } = $props();
</script>

<div class="navbar bg-base-100 print:hidden">
    <a class="btn btn-ghost text-xl" href="/">Home</a>
</div>
{@render children()}
