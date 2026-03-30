/**
 * Graph Data Structure
 * Implements a generic graph with event emission for MVC updates.
 */

import { dist } from '../utils/geometry.js';

export class Node {
    constructor(id, config) {
        this.id = id;
        this.config = config; // {x, y, theta}
        this.parentId = null; // For tree structures
        this.cost = 0;        // Cost from root
        this.outgoingEdges = new Set(); // Set of Edge IDs
        this.incomingEdges = new Set(); // Set of Edge IDs
    }
}

export class Edge {
    constructor(id, sourceId, targetId, cost) {
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.cost = cost; // Cost of this specific edge
    }
}

export class Graph {
    constructor() {
        this.nodes = new Map(); // id -> Node
        this.edges = new Map(); // id -> Edge
        this.listeners = new Map(); // eventType -> [callbacks]
        
        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;
    }

    // --- Event System ---

    addEventListener(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    emit(eventType, payload) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(cb => cb(payload));
        }
    }

    // --- Core Operations ---

    /**
     * Adds a node to the graph.
     * @param {Object} config - {x, y, theta}
     * @returns {Node} The created node
     */
    addNode(config) {
        const id = this.nodeIdCounter++;
        const node = new Node(id, config);
        this.nodes.set(id, node);
        this.emit('NODE_ADDED', { node });
        return node;
    }

    /**
     * Adds an edge between two nodes.
     * @param {number} sourceId 
     * @param {number} targetId 
     * @param {number} cost 
     * @returns {Edge} The created edge
     */
    addEdge(sourceId, targetId, cost) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
            console.error(`Cannot add edge: Nodes ${sourceId} or ${targetId} do not exist.`);
            return null;
        }

        const id = this.edgeIdCounter++;
        const edge = new Edge(id, sourceId, targetId, cost);
        this.edges.set(id, edge);

        // Update adjacency info
        this.nodes.get(sourceId).outgoingEdges.add(id);
        this.nodes.get(targetId).incomingEdges.add(id);

        this.emit('EDGE_ADDED', { edge });
        return edge;
    }

    /**
     * Removes an edge from the graph.
     * @param {number} edgeId 
     */
    removeEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (!edge) return;

        // Update adjacency info
        if (this.nodes.has(edge.sourceId)) {
            this.nodes.get(edge.sourceId).outgoingEdges.delete(edgeId);
        }
        if (this.nodes.has(edge.targetId)) {
            this.nodes.get(edge.targetId).incomingEdges.delete(edgeId);
        }

        this.edges.delete(edgeId);
        this.emit('EDGE_REMOVED', { edgeId });
    }

    /**
     * Removes a node and all connected edges.
     * @param {number} nodeId 
     */
    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Remove all edges connected to this node
        // Convert to array to avoid modification during iteration issues
        const edgesToRemove = [...node.outgoingEdges, ...node.incomingEdges];
        edgesToRemove.forEach(edgeId => this.removeEdge(edgeId));

        this.nodes.delete(nodeId);
        // Note: We might want a NODE_REMOVED event if we were doing full dynamic updates,
        // but RRT usually only adds. Pruning (rewiring) usually handles edges.
        // Reconnection might remove nodes though.
        this.emit('NODE_REMOVED', { nodeId }); 
    }

    /**
     * Clears the entire graph.
     */
    clear() {
        this.nodes.clear();
        this.edges.clear();
        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;
        this.emit('CLEAR', {});
    }

    /**
     * Gets neighbor nodes for a given node ID.
     * @param {number} nodeId 
     * @returns {Node[]} Array of neighbor nodes
     */
    getNeighbors(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return [];
        
        const neighbors = [];
        node.outgoingEdges.forEach(edgeId => {
            const edge = this.edges.get(edgeId);
            if (edge && this.nodes.has(edge.targetId)) {
                neighbors.push(this.nodes.get(edge.targetId));
            }
        });
        // If graph is undirected, we might want incoming too?
        // For directed graphs (Dubins), neighbors usually means "reachable from here".
        return neighbors;
    }

    // --- Helper Algorithms ---

    /**
     * Finds the nearest node in the graph to a target configuration.
     * Uses the robot's distance metric.
     * @param {Object} targetConfig 
     * @param {Object} robot - Robot instance with distance() method
     * @returns {Object} { node, dist } or null if empty
     */
    getNearestNode(targetConfig, robot) {
        let nearest = null;
        let minDist = Infinity;

        // Linear search - O(N). 
        // For production/large graphs, a KD-Tree is better, but harder for non-Euclidean (Dubins).
        // Since this is educational and N < 5000 usually, O(N) is fine.
        for (const node of this.nodes.values()) {
            const d = robot.distance(node.config, targetConfig);
            if (d < minDist) {
                minDist = d;
                nearest = node;
            }
        }

        return nearest ? { node: nearest, dist: minDist } : null;
    }

    /**
     * Finds all nodes within a certain radius.
     * @param {Object} targetConfig 
     * @param {number} radius 
     * @param {Object} robot 
     * @returns {Node[]}
     */
    getNodesWithinDistance(targetConfig, radius, robot) {
        const result = [];
        for (const node of this.nodes.values()) {
            if (robot.distance(node.config, targetConfig) <= radius) {
                result.push(node);
            }
        }
        return result;
    }

    /**
     * Reconstructs the path from a node back to the root via parent pointers.
     * @param {number} nodeId 
     * @returns {Node[]} Path from root to node
     */
    getPathToRoot(nodeId) {
        const path = [];
        let curr = this.nodes.get(nodeId);
        while (curr) {
            path.unshift(curr); // Add to front to get Root -> Node order
            if (curr.parentId === null) break;
            curr = this.nodes.get(curr.parentId);
        }
        return path;
    }
}
