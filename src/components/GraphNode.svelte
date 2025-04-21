<script>
  import { graphStore } from "../lib/graphStore.js";
  import { onDestroy } from "svelte";

  export let id;
  export let x;
  export let y;
  export let label;
  export let selected = false;
  export let connecting = false;
  export let setInteractingWithNode;

  let mode;
  const unsubscribe = graphStore.subscribe((state) => {
    mode = state.mode;

    if (state.nodes.every((node) => node.id !== id)) {
      setInteractingWithNode(false);
    }
  });

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let isHovered = false;

  $: isDeleteMode = mode === "deletingNode";
  $: isEditMode = mode === "editingNode";
  $: isMoveNodesMode = mode === "moveNodes";
  $: isConnectingMode = mode === "connecting";
  $: shouldBeInteractive =
    isDeleteMode ||
    isEditMode ||
    isMoveNodesMode ||
    isConnectingMode ||
    isHovered;
  $: pointerEventsStyle = shouldBeInteractive ? "auto" : "none";

  $: nodeColor =
    isDeleteMode && isHovered
      ? "#FF5252"
      : isEditMode && isHovered
        ? "#FFEB3B"
        : selected && connecting
          ? "#4CAF50"
          : selected
            ? "#2196F3"
            : "#ffffff";

  $: cursorStyle = isDeleteMode
    ? "pointer"
    : isEditMode
      ? "text"
      : isMoveNodesMode
        ? "grabing"
        : mode === "pan"
          ? "default"
          : "pointer";

  function handleMouseDown(event) {
    setInteractingWithNode(true);

    event.stopPropagation();

    if (
      mode === "moveNodes" ||
      mode === "connecting" ||
      mode === "deletingNode" ||
      mode === "editingNode"
    ) {
      graphStore.selectNode(id);

      if (mode === "moveNodes") {
        isDragging = true;
        startX = event.clientX - x;
        startY = event.clientY - y;

        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleGlobalMouseUp);
      }
    }
  }

  function handleMouseEnter() {
    setInteractingWithNode(true);
    isHovered = true;
  }

  function handleMouseLeave() {
    if (!isDragging) {
      setInteractingWithNode(false);
    }
    isHovered = false;
  }

  function handleGlobalMouseMove(event) {
    if (isDragging) {
      const newX = event.clientX - startX;
      const newY = event.clientY - startY;
      graphStore.updateNodePosition(id, newX, newY);
    }
  }

  function handleGlobalMouseUp() {
    isDragging = false;
    setInteractingWithNode(false);
    window.removeEventListener("mousemove", handleGlobalMouseMove);
    window.removeEventListener("mouseup", handleGlobalMouseUp);
  }

  onDestroy(() => {
    setInteractingWithNode(false);
    unsubscribe();
    window.removeEventListener("mousemove", handleGlobalMouseMove);
    window.removeEventListener("mouseup", handleGlobalMouseUp);
  });
</script>

<button
  type="button"
  class="node"
  class:selected
  class:deleteMode={isDeleteMode && isHovered}
  class:editMode={isEditMode && isHovered}
  class:moveMode={isMoveNodesMode}
  style="left: {x}px; top: {y}px; background-color: {nodeColor}; cursor: {cursorStyle}; pointer-events: {pointerEventsStyle};"
  on:mousedown={handleMouseDown}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click|preventDefault={() => {}}
  on:dblclick|preventDefault={() => {}}
  on:focus|preventDefault={() => {}}
>
  <div class="node-label">{label}</div>
</button>

<style>
  .node {
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid #333;
    transform: translate(-50%, -50%);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      background-color 0.2s;
    padding: 0;
    overflow: visible;
  }

  .node:active.moveMode {
    cursor: grabbing;
  }

  .node.selected {
    border: 3px solid #2196f3;
    box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.3);
  }

  .node.deleteMode {
    border: 3px solid #ff5252;
    box-shadow: 0 0 0 4px rgba(255, 82, 82, 0.3);
  }

  .node.editMode {
    border: 3px solid #ffeb3b;
    box-shadow: 0 0 0 4px rgba(255, 235, 59, 0.3);
  }

  .node.moveMode {
    cursor: grab;
  }

  .node-label {
    font-weight: bold;
    font-size: 16px;
    color: #333;
    pointer-events: none;
  }
</style>
