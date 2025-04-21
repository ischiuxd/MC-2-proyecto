<script>
  import { graphStore } from "../lib/graphStore.js";

  export let id;
  export let sourceId;
  export let targetId;
  export let controlPoints = [];
  export let nodes = [];
  export let mode = "default";

  $: source = nodes.find((node) => node.id === sourceId);
  $: target = nodes.find((node) => node.id === targetId);

  $: path = calculatePath(source, target, controlPoints);
  $: pathStyle = `stroke: ${mode === "deleting" ? "#ff6b6b" : "#666"};
                  stroke-width: ${mode === "deleting" ? "3" : "2"};
                  stroke-dasharray: ${mode === "deleting" ? "5,3" : "none"};`;
  $: pathPointerEvents = mode === "deleting" ? "stroke" : "none";

  function calculatePath(source, target, controlPoints) {
    if (!source || !target) return "";

    if (controlPoints && controlPoints.length > 0) {
      let path = `M ${source.x} ${source.y}`;

      controlPoints.forEach((point) => {
        path += ` Q ${point.x} ${point.y}, ${target.x} ${target.y}`;
      });

      return path;
    } else {
      return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }
  }

  function handleClick(event) {
    if (mode === "deleting") {
      graphStore.selectEdge(id);
      graphStore.deleteEdge();
      event.stopPropagation();
    }
  }
</script>

<svg class="edge" width="100%" height="100%">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <path
    d={path}
    style={pathStyle}
    fill="none"
    stroke-linecap="round"
    on:click={handleClick}
    pointer-events={pathPointerEvents}
  >
  </path>
  {#if source && target}
    <marker
      id="arrowhead-{id}"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
    </marker>
  {/if}
</svg>

<style>
  .edge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }

  path {
    cursor: pointer;
    transition: stroke 0.2s;
  }
</style>
