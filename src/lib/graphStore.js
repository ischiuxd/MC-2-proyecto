import { writable } from "svelte/store";

function createGraphStore() {
  const initialState = {
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    mode: "pan",
  };

  const { subscribe, update } = writable(initialState);

  const generateId = () =>
    `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const doLinesCross = (line1, line2) => {
    const ccw = (A, B, C) => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };

    const line1Start = { x: line1.x1, y: line1.y1 };
    const line1End = { x: line1.x2, y: line1.y2 };
    const line2Start = { x: line2.x1, y: line2.y1 };
    const line2End = { x: line2.x2, y: line2.y2 };

    return (
      ccw(line1Start, line2Start, line2End) !==
        ccw(line1End, line2Start, line2End) &&
      ccw(line1Start, line1End, line2Start) !==
        ccw(line1Start, line1End, line2End)
    );
  };

  const findSmartPath = (sourceNode, targetNode, existingEdges, allNodes) => {
    const directPath = {
      x1: sourceNode.x,
      y1: sourceNode.y,
      x2: targetNode.x,
      y2: targetNode.y,
    };

    const existingLines = existingEdges
      .map((edge) => {
        const source = allNodes.find((n) => n.id === edge.sourceId);
        const target = allNodes.find((n) => n.id === edge.targetId);
        if (!source || !target) return null;

        return {
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
        };
      })
      .filter(Boolean);

    const hasCrossing = existingLines.some((line) =>
      doLinesCross(directPath, line)
    );

    if (!hasCrossing) {
      return { points: [] };
    } else {
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      const offsetX = (dy / len) * 40;
      const offsetY = (-dx / len) * 40;

      return {
        points: [{ x: midX + offsetX, y: midY + offsetY }],
      };
    }
  };
  const labelExists = (nodes, label, excludeNodeId = null) => {
    return nodes.some(
      (node) =>
        node.label === label &&
        (excludeNodeId === null || node.id !== excludeNodeId)
    );
  };
  const updateEdgesForNode = (nodeId, nodes, edges) => {
    return edges.map((edge) => {
      if (edge.sourceId === nodeId || edge.targetId === nodeId) {
        const source = nodes.find((n) => n.id === edge.sourceId);
        const target = nodes.find((n) => n.id === edge.targetId);

        if (source && target) {
          const path = findSmartPath(
            source,
            target,
            edges.filter((e) => e.id !== edge.id),
            nodes
          );

          return {
            ...edge,
            controlPoints: path.points,
          };
        }
      }
      return edge;
    });
  };

  return {
    subscribe,
    addNode: (
      x = window.innerWidth / 2,
      y = window.innerHeight / 2,
      customLabel = null
    ) => {
      update((state) => {
        let newLabel = customLabel || `N${state.nodes.length + 1}`;

        if (customLabel && labelExists(state.nodes, customLabel)) {
          alert(
            `El nodo "${customLabel}" ya existe. Por favor, use otro nombre.`
          );
          return state;
        }

        const newNode = {
          id: generateId(),
          label: newLabel,
          x,
          y,
        };

        return {
          ...state,
          nodes: [...state.nodes, newNode],
          mode: "moveNodes",
        };
      });
    },
    createNamedNode: (
      x = window.innerWidth / 2,
      y = window.innerHeight / 2
    ) => {
      const label = prompt("Ingrese nombre para el nuevo nodo:");

      if (label === null || label.trim() === "") {
        return;
      }

      update((state) => {
        if (labelExists(state.nodes, label)) {
          alert(`El nodo "${label}" ya existe. Por favor, use otro nombre.`);
          return state;
        }

        const newNode = {
          id: generateId(),
          label,
          x,
          y,
        };

        return {
          ...state,
          nodes: [...state.nodes, newNode],
          mode: "moveNodes",
        };
      });
    },
    selectNode: (nodeId) => {
      update((state) => {
        if (state.mode === "pan") {
          return state;
        }
        if (state.mode === "editingNode") {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (!node) return state;

          const newLabel = prompt(
            "Ingrese nuevo nombre para el nodo:",
            node.label
          );

          if (newLabel === null || newLabel.trim() === "") {
            return { ...state, mode: "pan" };
          }

          if (labelExists(state.nodes, newLabel, nodeId)) {
            alert(
              `El nodo "${newLabel}" ya existe. Por favor, use otro nombre.`
            );
            return { ...state, mode: "pan" };
          }

          return {
            ...state,
            nodes: state.nodes.map((n) =>
              n.id === nodeId ? { ...n, label: newLabel } : n
            ),
            mode: "pan",
          };
        }
        if (state.mode === "deletingNode") {
          return {
            ...state,
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            edges: state.edges.filter(
              (edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId
            ),
            mode: "pan",
            selectedNode: null,
          };
        }
        if (
          state.mode === "connecting" &&
          state.selectedNode &&
          state.selectedNode !== nodeId
        ) {
          const sourceId = state.selectedNode;
          const targetId = nodeId;

          const connectionExists = state.edges.some(
            (edge) =>
              (edge.sourceId === sourceId && edge.targetId === targetId) ||
              (edge.sourceId === targetId && edge.targetId === sourceId)
          );

          if (!connectionExists) {
            const source = state.nodes.find((n) => n.id === sourceId);
            const target = state.nodes.find((n) => n.id === targetId);

            if (source && target) {
              const path = findSmartPath(
                source,
                target,
                state.edges,
                state.nodes
              );

              const newEdge = {
                id: generateId(),
                sourceId,
                targetId,
                controlPoints: path.points,
              };

              return {
                ...state,
                edges: [...state.edges, newEdge],
                selectedNode: null,
                mode: "pan",
              };
            }
          }

          return {
            ...state,
            selectedNode: null,
            mode: "pan",
          };
        }
        return {
          ...state,
          selectedNode: nodeId,
          selectedEdge: null,
        };
      });
    },
    selectEdge: (edgeId) => {
      update((state) => {
        if (state.mode === "pan") {
          return state;
        }

        if (state.mode === "deleting") {
          return {
            ...state,
            edges: state.edges.filter((edge) => edge.id !== edgeId),
            selectedEdge: null,
            mode: "pan",
          };
        }

        return {
          ...state,
          selectedEdge: edgeId,
          selectedNode: null,
        };
      });
    },
    updateNodePosition: (nodeId, x, y) => {
      update((state) => {
        if (state.mode !== "moveNodes") {
          return state;
        }

        const updatedNodes = state.nodes.map((node) =>
          node.id === nodeId ? { ...node, x, y } : node
        );

        const updatedEdges = updateEdgesForNode(
          nodeId,
          updatedNodes,
          state.edges
        );

        return {
          ...state,
          nodes: updatedNodes,
          edges: updatedEdges,
        };
      });
    },
    setMode: (mode) => {
      update((state) => ({
        ...state,
        mode,
        selectedNode: null,
        selectedEdge: null,
      }));
    },
    resetSelection: () => {
      update((state) => ({
        ...state,
        selectedNode: null,
        selectedEdge: null,
      }));
    },

    executeGraph: () => {
      update((state) => {
        const connectionMap = {};
        state.nodes.forEach((node) => {
          connectionMap[node.label] = [];
        });
        state.edges.forEach((edge) => {
          const sourceNode = state.nodes.find((n) => n.id === edge.sourceId);
          const targetNode = state.nodes.find((n) => n.id === edge.targetId);

          if (sourceNode && targetNode) {
            connectionMap[sourceNode.label].push(targetNode.label);
            connectionMap[targetNode.label].push(sourceNode.label);
          }
        });

        let summary = "Conexiones del grafo:\n";
        Object.entries(connectionMap).forEach(([nodeLabel, connections]) => {
          const uniqueConnections = [...new Set(connections)].sort();
          console.log(
            `${nodeLabel} está conectado con: ${
              uniqueConnections.join(", ") || "ningún nodo"
            }`
          );
          summary += `${nodeLabel} está conectado con: ${
            uniqueConnections.join(", ") || "ningún nodo"
          }\n`;
        });

        alert(summary);

        return state;
      });
    },
  };
}

export const graphStore = createGraphStore();
