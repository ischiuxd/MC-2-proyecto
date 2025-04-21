<script>
  import { graphStore } from "../lib/graphStore.js";

  let showOptions = false;

  function toggleOptions() {
    showOptions = !showOptions;
  }

  function createNode() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    graphStore.createNamedNode(centerX, centerY);
    showOptions = false;
  }

  function startConnecting() {
    graphStore.setMode("connecting");
    showOptions = false;
  }

  function deleteConnection() {
    graphStore.setMode("deleting");
    showOptions = false;
  }

  function deleteNode() {
    graphStore.setMode("deletingNode");
    showOptions = false;
  }

  function editNode() {
    graphStore.setMode("editingNode");
    showOptions = false;
  }

  function executeGraph() {
    graphStore.executeGraph();
    showOptions = false;
  }
</script>

<div class="toolbar">
  <button class="main-button" on:click={toggleOptions}>
    <span class="plus-icon">+</span>
  </button>

  {#if showOptions}
    <div class="options">
      <button on:click={createNode}>
        <span class="icon">📍</span>
        <span>Crear Nodo</span>
      </button>
      <button on:click={editNode}>
        <span class="icon">✒️</span>
        <span>Editar Nodo</span>
      </button>
      <button on:click={deleteNode}>
        <span class="icon">🗑️</span>
        <span>Eliminar Nodo</span>
      </button>
      <button on:click={startConnecting}>
        <span class="icon">🙌</span>
        <span>Enlazar</span>
      </button>
      <button on:click={deleteConnection}>
        <span class="icon">✂️</span>
        <span>Desenlazar</span>
      </button>
      <button on:click={executeGraph}>
        <span class="icon">🎉</span>
        <span>Ejecutar</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .toolbar {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }

  .main-button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #4c6ef5;
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .plus-icon {
    font-size: 32px;
    line-height: 1;
  }

  .options {
    position: absolute;
    top: 70px;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    width: 180px;
    display: flex;
    flex-direction: column;
  }

  .options button {
    padding: 12px 16px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 16px;
    display: flex;
    align-items: center;
  }

  .options button:hover {
    background-color: #f5f5f5;
  }

  .icon {
    margin-right: 8px;
    font-size: 18px;
    width: 24px;
    text-align: center;
  }
</style>
