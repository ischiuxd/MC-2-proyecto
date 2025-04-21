<script>
  import { graphStore } from "../lib/graphStore.js";
  import { onMount, onDestroy } from "svelte";
  let currentMode = "pan";
  let unsubscribe;

  onMount(() => {
    graphStore.setMode("pan");
    unsubscribe = graphStore.subscribe((state) => {
      currentMode = state.mode;
    });
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  function enablePanMode() {
    graphStore.setMode("pan");
  }

  function enableMoveNodesMode() {
    graphStore.setMode("moveNodes");
  }
</script>

<div class="nav-buttons">
  <button
    class="nav-button"
    class:active={currentMode === "pan"}
    on:click={enablePanMode}
    title="Mover canvas"
  >
    <span class="icon">⚙</span>
  </button>
  <button
    class="nav-button"
    class:active={currentMode === "moveNodes"}
    on:click={enableMoveNodesMode}
    title="Mover nodos"
  >
    <span class="icon">⦿</span>
  </button>
</div>

<style>
  .nav-buttons {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .nav-button {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: white;
    color: #333;
    border: none;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  }

  .nav-button:hover {
    background-color: #f5f5f5;
  }

  .nav-button.active {
    background-color: #4c6ef5;
    color: white;
    box-shadow: 0 4px 12px rgba(76, 110, 245, 0.4);
  }

  .icon {
    font-size: 18px;
  }
</style>
