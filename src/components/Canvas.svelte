<script>
  import { onMount } from "svelte";
  import { graphStore } from "../lib/graphStore.js";
  import { cycleStore } from "../lib/cycleStore.js";
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import GraphCycle from "./GraphCycle.svelte";

  let canvasContainer;
  let svgLayer;
  let isDragging = false;
  let startPanX = 0;
  let startPanY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;

  let nodes = [];
  let edges = [];
  let mode = "default";
  let selectedNode = null;
  let eulerianCycle = null;

  const unsubscribeGraph = graphStore.subscribe((state) => {
    nodes = state.nodes;
    edges = state.edges;
    mode = state.mode;
    selectedNode = state.selectedNode;
  });

  const unsubscribeCycle = cycleStore.subscribe((state) => {
    eulerianCycle = state.eulerianCycle;
  });

  $: transformStyle = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  $: canPan = mode === "default" || mode === "pan";
  $: cursorStyle =
    mode === "connecting" && !selectedNode
      ? "cell"
      : mode === "connecting" && selectedNode
        ? "crosshair"
        : mode === "deleting"
          ? "copy"
          : mode === "deletingNode"
            ? "not-allowed"
            : mode === "moveNodes"
              ? "alias"
              : mode === "editingNode"
                ? "help"
                : isDragging
                  ? "grabbing"
                  : "move";

  let isInteractingWithNode = false;

  function setInteractingWithNode(value) {
    isInteractingWithNode = value;
  }

  function drawGrid(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
    ctx.lineWidth = 1;

    const gridSize = 20;
    const offsetXMod = offsetX % gridSize;
    const offsetYMod = offsetY % gridSize;

    for (let x = offsetXMod; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    for (let y = offsetYMod; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();
  }

  function handleMouseDown(event) {
    if (!isInteractingWithNode && canPan) {
      isDragging = true;
      startPanX = event.clientX - offsetX;
      startPanY = event.clientY - offsetY;
      event.preventDefault();
    }
  }

  function handleMouseMove(event) {
    if (isDragging) {
      offsetX = event.clientX - startPanX;
      offsetY = event.clientY - startPanY;

      if (canvasContext) {
        drawGrid(canvasContext, canvasElement.width, canvasElement.height);
      }
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleWheel(event) {
    event.preventDefault();
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.max(0.1, Math.min(5, scale * scaleFactor));

    if (canvasContext) {
      drawGrid(canvasContext, canvasElement.width, canvasElement.height);
    }
  }

  function handleCanvasClick(event) {
    if (!isInteractingWithNode && !(mode === "connecting" && selectedNode)) {
      graphStore.resetSelection();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      graphStore.resetSelection();
    } else if (event.key === " " || event.key === "Enter") {
      if (!isInteractingWithNode) {
        isDragging = !isDragging;
        if (isDragging) {
          startPanX = offsetX;
          startPanY = offsetY;
        }
      }
    } else if (isDragging && !isInteractingWithNode) {
      const panStep = 20;
      if (event.key === "ArrowLeft") offsetX -= panStep;
      if (event.key === "ArrowRight") offsetX += panStep;
      if (event.key === "ArrowUp") offsetY -= panStep;
      if (event.key === "ArrowDown") offsetY += panStep;

      if (canvasContext) {
        drawGrid(canvasContext, canvasElement.width, canvasElement.height);
      }
    }
  }

  let canvasElement;
  let canvasContext;

  onMount(() => {
    canvasElement = document.createElement("canvas");
    canvasElement.className = "grid-canvas";
    canvasElement.width = canvasContainer.clientWidth;
    canvasElement.height = canvasContainer.clientHeight;
    canvasElement.style.position = "absolute";
    canvasElement.style.top = "0";
    canvasElement.style.left = "0";
    canvasElement.style.zIndex = "0";
    canvasElement.style.pointerEvents = "none";
    canvasContext = canvasElement.getContext("2d");

    canvasContainer.insertBefore(canvasElement, canvasContainer.firstChild);

    drawGrid(canvasContext, canvasElement.width, canvasElement.height);

    canvasContainer.addEventListener("wheel", handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvasElement.width = width;
        canvasElement.height = height;
        drawGrid(canvasContext, width, height);
      }
    });

    resizeObserver.observe(canvasContainer);

    return () => {
      canvasContainer.removeEventListener("wheel", handleWheel);
      resizeObserver.disconnect();
      unsubscribeGraph();
      unsubscribeCycle();
    };
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="canvas-container"
  bind:this={canvasContainer}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  on:click={handleCanvasClick}
  on:keydown={handleKeyDown}
  style="cursor: {cursorStyle}"
  tabindex="0"
  role="application"
  aria-label="Interactive graph canvas"
>
  <div
    class="graph-content"
    style="transform: {transformStyle}"
    bind:this={svgLayer}
  >
    {#each edges as edge (edge.id)}
      <GraphEdge {...edge} {nodes} {mode} />
    {/each}

    {#if eulerianCycle}
      {#each edges as edge (edge.id)}
        <GraphCycle
          id={edge.id}
          sourceId={edge.sourceId}
          targetId={edge.targetId}
          controlPoints={edge.controlPoints || []}
          {nodes}
          {eulerianCycle}
        />
      {/each}
    {/if}

    {#each nodes as node (node.id)}
      <GraphNode
        {...node}
        selected={selectedNode === node.id}
        connecting={mode === "connecting"}
        {setInteractingWithNode}
      />
    {/each}
  </div>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
    outline: none;
    background-color: #fafafa;
  }

  .graph-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: center;
    pointer-events: all;
    z-index: 1;
    overflow: visible;
  }
</style>
