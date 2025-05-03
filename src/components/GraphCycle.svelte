<script>
  import { onMount, onDestroy } from "svelte";

  export let id;
  export let sourceId;
  export let targetId;
  export let controlPoints = [];
  export let nodes = [];
  export let eulerianCycle = null;

  let pathElement;
  let currentHighlightedEdge = 0;
  let animationInterval = null;
  let animationSpeed = 1000;

  $: source = nodes.find((node) => node.id === sourceId);
  $: target = nodes.find((node) => node.id === targetId);
  $: sourceLabel = source?.label || "";
  $: targetLabel = target?.label || "";

  $: isPartOfCycle =
    eulerianCycle?.edgeOrderMap && id in eulerianCycle.edgeOrderMap;
  $: edgeInfo = isPartOfCycle ? eulerianCycle.edgeOrderMap[id] : null;
  $: edgeOrder = edgeInfo?.order || 0;
  $: cycleEdgesCount = isPartOfCycle
    ? Object.keys(eulerianCycle.edgeOrderMap).length
    : 0;

  $: cycleStrokeWidth = isPartOfCycle ? 4 : 0;
  $: cycleStrokeColor = isPartOfCycle ? "#4CAF50" : "transparent";
  $: isHighlighted = isPartOfCycle && edgeOrder === currentHighlightedEdge;
  $: numberColor = isHighlighted ? "#FFFFFF" : "#333";
  $: circleColor = isHighlighted ? "#FF0000" : "#E3F2FD";
  $: circleStrokeColor = isHighlighted ? "#FF0000" : "#4CAF50";

  $: path = calculatePath(source, target, controlPoints);

  $: if (isPartOfCycle && edgeInfo) {
    console.log(
      `Arista: ${sourceLabel} → ${targetLabel}, Camino: ${edgeOrder} de ${cycleEdgesCount}`
    );
  }

  $: if (eulerianCycle && isPartOfCycle) {
    startAnimation();
  } else if (!eulerianCycle && animationInterval) {
    stopAnimation();
  }

  onMount(() => {
    if (eulerianCycle && isPartOfCycle) {
      startAnimation();
    }
  });

  onDestroy(() => {
    stopAnimation();
  });

  function startAnimation() {
    stopAnimation();

    currentHighlightedEdge = 1;

    animationInterval = setInterval(() => {
      currentHighlightedEdge = (currentHighlightedEdge % cycleEdgesCount) + 1;
    }, animationSpeed);
  }

  function stopAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
      currentHighlightedEdge = 0;
    }
  }

  function calculatePath(source, target, controlPoints) {
    if (!source || !target) return "";

    if (controlPoints?.length > 0) {
      const point = controlPoints[0];
      return `M ${source.x} ${source.y} Q ${point.x} ${point.y}, ${target.x} ${target.y}`;
    } else {
      return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }
  }

  function getOrderLabelPosition() {
    if (!source || !target) return { x: 0, y: 0 };
    if (controlPoints?.length > 0) {
      const t = 0.5;
      const point = controlPoints[0];

      const x =
        Math.pow(1 - t, 2) * source.x +
        2 * (1 - t) * t * point.x +
        Math.pow(t, 2) * target.x;

      const y =
        Math.pow(1 - t, 2) * source.y +
        2 * (1 - t) * t * point.y +
        Math.pow(t, 2) * target.y;

      return { x, y };
    } else {
      return {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2,
      };
    }
  }
</script>

<svg class="edge-cycle" width="100%" height="100%" pointer-events="none">
  <path
    bind:this={pathElement}
    d={path}
    class="cycle-path"
    style="stroke: {cycleStrokeColor}; stroke-width: {cycleStrokeWidth};"
    fill="none"
    stroke-linecap="round"
    pointer-events="none"
  />

  {#if isPartOfCycle && source && target}
    {@const labelPos = getOrderLabelPosition()}
    <g class="order-number">
      <circle
        cx={labelPos.x}
        cy={labelPos.y}
        r="12"
        class="order-circle"
        style="fill: {circleColor}; stroke: {circleStrokeColor};"
      />
      <text
        x={labelPos.x}
        y={labelPos.y}
        text-anchor="middle"
        dominant-baseline="central"
        class="order-text"
        style="fill: {numberColor};"
      >
        {edgeOrder}
      </text>
    </g>
  {/if}
</svg>

<style>
  .edge-cycle {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 10;
    overflow: visible;
  }

  .cycle-path {
    transition:
      stroke 0.3s,
      stroke-width 0.3s;
    pointer-events: none;
  }

  .order-circle {
    stroke-width: 1.5;
    transition:
      fill 0.3s ease,
      stroke 0.3s ease;
    pointer-events: none;
  }

  .order-text {
    font-weight: bold;
    font-size: 14px;
    transition: fill 0.3s ease;
    user-select: none;
    pointer-events: none;
  }
</style>
