import { writable } from "svelte/store";

class GraphService {
  createNodeMap(nodes) {
    return new Map(nodes.map((node) => [node.label, node]));
  }

  createNodeIdToLabelMap(nodes) {
    return new Map(nodes.map((node) => [node.id, node.label]));
  }

  buildAdjacencyList(nodes, edges) {
    if (!nodes?.length) return {};
    const adjList = this._initializeAdjacencyList(nodes);
    const nodeIdToLabelMap = this.createNodeIdToLabelMap(nodes);
    return this._populateAdjacencyList(adjList, edges, nodeIdToLabelMap);
  }

  _initializeAdjacencyList(nodes) {
    const adjList = {};
    nodes.forEach((node) => {
      adjList[node.label] = [];
    });
    return adjList;
  }

  _populateAdjacencyList(adjList, edges, nodeIdToLabelMap) {
    for (const edge of edges) {
      const sourceLabel = nodeIdToLabelMap.get(edge.sourceId);
      const targetLabel = nodeIdToLabelMap.get(edge.targetId);

      if (sourceLabel && targetLabel) {
        this._addConnection(adjList, sourceLabel, targetLabel, edge);
        this._addConnection(adjList, targetLabel, sourceLabel, edge);
      }
    }
    return adjList;
  }

  _addConnection(adjList, source, target, edge) {
    const connection = {
      nodeLabel: target,
      edgeId: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
    };
    adjList[source].push(connection);
  }

  getOddDegreeNodes(adjList) {
    const oddNodes = Object.entries(adjList)
      .filter(([_, neighbors]) => neighbors.length % 2 !== 0)
      .map(([label]) => label);

    return oddNodes;
  }

  getZeroDegreeNodes(adjList) {
    const zeroNodes = Object.entries(adjList)
      .filter(([_, neighbors]) => neighbors.length === 0)
      .map(([label]) => label);

    return zeroNodes;
  }

  hasEulerianCycle(nodes, edges) {
    if (!nodes?.length || !edges?.length) return false;

    const adjList = this.buildAdjacencyList(nodes, edges);

    const zeroNodes = this.getZeroDegreeNodes(adjList);
    if (zeroNodes.length > 0) {
      return false;
    }

    const allEven = Object.values(adjList).every(
      (conns) => conns.length % 2 === 0
    );
    if (!allEven) {
      return false;
    }

    const isConnected = this.isGraphConnected(adjList);
    return isConnected;
  }

  dfs(adjList, nodeLabel, visited) {
    visited.add(nodeLabel);
    for (const neighbor of adjList[nodeLabel]) {
      if (!visited.has(neighbor.nodeLabel)) {
        this.dfs(adjList, neighbor.nodeLabel, visited);
      }
    }
  }

  isGraphConnected(adjList) {
    const nodesWithEdges = Object.keys(adjList).filter(
      (k) => adjList[k].length > 0
    );

    if (nodesWithEdges.length === 0) return true;

    const visited = new Set();
    this.dfs(adjList, nodesWithEdges[0], visited);

    return visited.size === nodesWithEdges.length;
  }

  updateGraphStatus(nodes, edges) {
    const adjList = this.buildAdjacencyList(nodes, edges);
    const status = {
      hasEulerianCycle: this.hasEulerianCycle(nodes, edges),
      oddDegreeNodes: this.getOddDegreeNodes(adjList),
      zeroDegreeNodes: this.getZeroDegreeNodes(adjList),
      isConnected: this.isGraphConnected(adjList),
      nodeCount: nodes?.length || 0,
      edgeCount: edges?.length || 0,
    };
    console.log("Estado del grafo:", status);
    return status;
  }
}
class EulerianCycleService {
  constructor(graphService) {
    this.graphService = graphService;
  }

  findEulerianCycle(nodes, edges) {
    if (!this.graphService.hasEulerianCycle(nodes, edges)) {
      return null;
    }

    const adjList = this.graphService.buildAdjacencyList(nodes, edges);
    const usedEdges = new Set();

    const start = Object.keys(adjList).find((k) => adjList[k].length > 0);
    if (!start) {
      return null;
    }

    return this._findEulerianCycleHierholzer(
      adjList,
      start,
      usedEdges,
      edges.length
    );
  }

  _findEulerianCycleHierholzer(adjList, startNode, usedEdges) {
    const workingAdjList = {};
    for (const node in adjList) {
      workingAdjList[node] = [...adjList[node]];
    }
    const { nodePath, edgePath, edgeDetailsPath } = this._findTour(
      workingAdjList,
      startNode,
      usedEdges
    );
    let i = 0;
    while (i < nodePath.length) {
      const current = nodePath[i];
      if (workingAdjList[current] && workingAdjList[current].length > 0) {
        const {
          nodePath: subTour,
          edgePath: subEdgePath,
          edgeDetailsPath: subEdgeDetails,
        } = this._findTour(workingAdjList, current, usedEdges);
        nodePath.splice(i + 1, 0, ...subTour.slice(1));
        edgePath.splice(i, 0, ...subEdgePath);
        edgeDetailsPath.splice(i, 0, ...subEdgeDetails);
      } else {
        i++;
      }
    }

    return {
      nodePath,
      edgePath,
      edgeDetailsPath,
      labelPath: nodePath,
    };
  }

  _findTour(workingAdjList, startNode, usedEdges) {
    const nodePath = [startNode];
    const edgePath = [];
    const edgeDetailsPath = [];

    let current = startNode;
    while (workingAdjList[current] && workingAdjList[current].length > 0) {
      const nextConnIndex = workingAdjList[current].findIndex(
        (c) => !usedEdges.has(c.edgeId)
      );

      if (nextConnIndex === -1) break;

      const nextConn = workingAdjList[current][nextConnIndex];
      usedEdges.add(nextConn.edgeId);
      workingAdjList[current].splice(nextConnIndex, 1);
      const targetNode = nextConn.nodeLabel;
      const reverseEdgeIndex = workingAdjList[targetNode].findIndex(
        (c) => c.edgeId === nextConn.edgeId
      );
      if (reverseEdgeIndex !== -1) {
        workingAdjList[targetNode].splice(reverseEdgeIndex, 1);
      }
      edgePath.push(nextConn.edgeId);
      edgeDetailsPath.push({ ...nextConn, sourceLabel: current });
      current = nextConn.nodeLabel;
      nodePath.push(current);
    }

    return { nodePath, edgePath, edgeDetailsPath };
  }
}

class GraphAnalyzer {
  constructor(graphService, eulerianCycleService) {
    this.graphService = graphService;
    this.eulerianCycleService = eulerianCycleService;
  }

  analyzeGraph(nodes, edges) {
    console.log(
      `Analizando grafo con ${nodes.length} nodos y ${edges.length} aristas`
    );
    const connectionSummary = this._generateConnectionSummary(nodes, edges);
    const cycleAnalysis = this._analyzeCycleStatus(nodes, edges);

    const summary = `${connectionSummary}\n\n${cycleAnalysis.statusText}`;

    return {
      summary,
      cycleResult: cycleAnalysis.cycleResult,
    };
  }

  _generateConnectionSummary(nodes, edges) {
    const connMap = {};
    const idToLabel = this.graphService.createNodeIdToLabelMap(nodes);

    nodes.forEach((n) => (connMap[n.label] = []));

    edges.forEach((e) => {
      const a = idToLabel.get(e.sourceId);
      const b = idToLabel.get(e.targetId);
      if (a && b) {
        connMap[a].push(b);
        connMap[b].push(a);
      }
    });

    let summary = "Conexiones del grafo:\n";
    for (const [label, neighbors] of Object.entries(connMap)) {
      const uniqueNeighbors = [...new Set(neighbors)].sort();
      const neighborText = uniqueNeighbors.length
        ? uniqueNeighbors.join(", ")
        : "ningun nodo";
      summary += `${label} esta conectado con: ${neighborText}\n`;
    }

    return summary;
  }

  _analyzeCycleStatus(nodes, edges) {
    const hasCycle = this.graphService.hasEulerianCycle(nodes, edges);
    let statusText = "";
    let cycleResult = null;

    if (hasCycle) {
      statusText = "Este grafo contiene un ciclo euleriano.\n";
      const cycle = this.eulerianCycleService.findEulerianCycle(nodes, edges);

      if (cycle) {
        const cyclePath = cycle.labelPath.join(" → ");
        console.log("Ciclo encontrado:", cyclePath);
        statusText += `Ciclo euleriano encontrado: ${cyclePath}\n`;
        cycleResult = this._generateCycleResult(cycle);
      }
    } else {
      statusText = this._generateNonCycleStatus(nodes, edges);
    }

    return { statusText, cycleResult };
  }

  _generateNonCycleStatus(nodes, edges) {
    if (nodes.length === 0) return "El grafo esta vacio\n";
    if (edges.length === 0) return "El grafo no tiene aristas\n";

    const adjList = this.graphService.buildAdjacencyList(nodes, edges);
    const oddNodes = this.graphService.getOddDegreeNodes(adjList);
    const zeroNodes = this.graphService.getZeroDegreeNodes(adjList);

    if (zeroNodes.length > 0) {
      return `Nodos sin conexiones: ${zeroNodes.join(", ")}.\n`;
    }

    if (oddNodes.length > 0) {
      return `Nodos con grado impar: ${oddNodes.join(", ")}.\n`;
    }

    return "El grafo no esta conectado.\n";
  }

  _generateCycleResult(cycle) {
    const edgeOrderMap = {};

    cycle.edgePath.forEach((id, i) => {
      const detail = cycle.edgeDetailsPath[i];
      edgeOrderMap[id] = {
        order: i + 1,
        ...detail,
      };
    });

    return {
      path: cycle,
      edgeOrderMap,
    };
  }
}

function createCycleStore() {
  const initial = {
    eulerianCycle: null,
    analysisResults: null,
    graphStatus: null,
    lastAnalyzedGraph: { nodeCount: 0, edgeCount: 0, timestamp: 0 },
    realTimeAnalysis: false,
  };

  const { subscribe, set, update } = writable(initial);

  const graphService = new GraphService();
  const eulerianCycleService = new EulerianCycleService(graphService);
  const graphAnalyzer = new GraphAnalyzer(graphService, eulerianCycleService);

  const _executeAnalysis = (nodes, edges, silent = false) => {
    const { summary, cycleResult } = graphAnalyzer.analyzeGraph(nodes, edges);
    const status = graphService.updateGraphStatus(nodes, edges);

    update((state) => ({
      ...state,
      eulerianCycle: cycleResult,
      analysisResults: summary,
      graphStatus: status,
      lastAnalyzedGraph: {
        nodeCount: nodes?.length || 0,
        edgeCount: edges?.length || 0,
        timestamp: Date.now(),
      },
    }));

    if (!silent) {
      console.log("Resultados del analisis:", summary);
      alert(summary);
    }
    return { summary, cycleResult };
  };

  return {
    subscribe,
    analyzeCycle(nodes, edges) {
      return _executeAnalysis(nodes, edges, false);
    },
    silentAnalyze(nodes, edges) {
      return _executeAnalysis(nodes, edges, true);
    },
    hasEulerianCycle: (nodes, edges) => {
      return graphService.hasEulerianCycle(nodes, edges);
    },
    findEulerianCycle: (nodes, edges) => {
      return eulerianCycleService.findEulerianCycle(nodes, edges);
    },
    getOddDegreeNodes: (nodes, edges) => {
      const adjList = graphService.buildAdjacencyList(nodes, edges);
      return graphService.getOddDegreeNodes(adjList);
    },
    getZeroDegreeNodes: (nodes, edges) => {
      const adjList = graphService.buildAdjacencyList(nodes, edges);
      return graphService.getZeroDegreeNodes(adjList);
    },
    reset: () => {
      set(initial);
    },
  };
}

export const cycleStore = createCycleStore();
