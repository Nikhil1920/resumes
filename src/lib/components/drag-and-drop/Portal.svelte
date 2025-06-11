<script lang="ts">
    let { target = globalThis.document?.body, children } = $props();

    let ref: any;

    $effect(() => {
        if (target) {
            target.appendChild(ref);
        }
        return () => {
            let _ref = ref;
            setTimeout(() => {
                if (_ref?.parentNode) {
                    _ref.parentNode?.removeChild(_ref);
                }
            });
        };
    });
</script>

<div bind:this={ref}>
    {@render children?.()}
</div>
