<script lang="ts">
    import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

    type Props = {
        edge: Edge;
        gap: string;
    };
    let { edge, gap }: Props = $props();

    type Orientation = "horizontal" | "vertical";

    const edgeToOrientationMap: Record<Edge, Orientation> = {
        top: "horizontal",
        bottom: "horizontal",
        left: "vertical",
        right: "vertical",
    };

    // Use new arbitrary property syntax for all custom props
    const orientationStyles: Record<Orientation, string> = {
        horizontal:
            "[height:var(--line-thickness)] [left:var(--terminal-radius)] [right:0] before:[left:var(--negative-terminal-size)]",
        vertical:
            "[width:var(--line-thickness)] [top:var(--terminal-radius)] [bottom:0] before:[top:var(--negative-terminal-size)]",
    };

    const edgeStyles: Record<Edge, string> = {
        top: "[top:var(--line-offset)] before:[top:var(--offset-terminal)]",
        right: "[right:var(--line-offset)] before:[right:var(--offset-terminal)]",
        bottom: "[bottom:var(--line-offset)] before:[bottom:var(--offset-terminal)]",
        left: "[left:var(--line-offset)] before:[left:var(--offset-terminal)]",
    };

    const strokeSize = 2;
    const terminalSize = 8;
    const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2;
</script>

<div
    style={`--line-thickness: ${strokeSize}px; 
            --line-offset: calc(-0.5 * (${gap} + ${strokeSize}px)); 
            --terminal-size: ${terminalSize}px; 
            --terminal-radius: ${terminalSize / 2}px; 
            --negative-terminal-size: -${terminalSize}px; 
            --offset-terminal: ${offsetToAlignTerminalWithLine}px;`}
    class={`absolute z-10 bg-blue-700 pointer-events-none before:content-[''] before:[width:var(--terminal-size)] before:[height:var(--terminal-size)] box-border before:absolute before:[border-width:var(--line-thickness)] before:border-solid before:border-blue-700 before:rounded-full ${orientationStyles[edgeToOrientationMap[edge]]} ${edgeStyles[edge]}`}
></div>
