/**
 * Abstract Planner Base Class
 * Defines the common interface and state for all motion planners.
 */

import { EventEmitter } from '../core/events.js';
import { Random } from '../core/random.js';

export class PlannerBase extends EventEmitter {
    constructor(robot, graph) {
        super();
        this.robot = robot;
        this.graph = graph;
        
        this.startConfig = null;
        this.goalRegions = [];
        this.bestSolution = null; 
        this.startNodeId = null; // Track the root/start node ID
        
        this.sampler = 'UNIFORM'; 
        this.rng = new Random(); 

        this.stats = {
            nodesVisited: 0,
            edgesEvaluated: 0,
            startTime: 0
        };
    }

    setSeed(seed) {
        this.rng = new Random(seed);
    }

    initialize(startConfig, goalRegions) {
        this.startConfig = startConfig;
        this.goalRegions = goalRegions;
        this.bestSolution = null;
        this.stats = {
            nodesVisited: 0,
            edgesEvaluated: 0,
            startTime: Date.now()
        };

        const root = this.graph.addNode(startConfig);
        root.cost = 0;
        root.parentId = null;
        this.startNodeId = root.id;
    }

    updateParameters(params) {
        if (params.sampler !== undefined) this.sampler = params.sampler;
    }

    step() {
        throw new Error("step() must be implemented by subclass");
    }

    // --- Interactive Updates ---

    reconnect(newStartConfig) {
        // Default safe behavior: Full Reset
        this.graph.clear();
        this.initialize(newStartConfig, this.goalRegions);
    }

    updateGoals(newGoalRegions) {
        this.goalRegions = newGoalRegions;
    }

    repairGraph() {
        const edgesToRemove = [];
        
        for (const edge of this.graph.edges.values()) {
            const n1 = this.graph.nodes.get(edge.sourceId);
            const n2 = this.graph.nodes.get(edge.targetId);
            
            if (!n1 || !n2) {
                edgesToRemove.push(edge.id);
                continue;
            }

            const d = this.robot.distance(n1.config, n2.config);
            const steerRes = this.robot.steer(n1.config, n2.config, d);
            
            if (!this.robot.isValidLink(n1.config, n2.config, steerRes.path)) {
                edgesToRemove.push(edge.id);
            }
        }

        edgesToRemove.forEach(id => this.graph.removeEdge(id));

        if (this.bestSolution) {
            let valid = true;
            const path = this.bestSolution.path;
            
            for (let i = 0; i < path.length - 1; i++) {
                const u = path[i];
                const v = path[i+1];
                let connected = false;
                
                if (v.parentId === u.id) {
                     connected = [...u.outgoingEdges].some(eid => {
                         const e = this.graph.edges.get(eid);
                         return e && e.targetId === v.id;
                     });
                } else {
                     connected = [...u.outgoingEdges].some(eid => {
                         const e = this.graph.edges.get(eid);
                         return e && e.targetId === v.id;
                     });
                }

                if (!connected) {
                    valid = false;
                    break;
                }
            }
            
            if (!this.robot.isValidConfig(path[0].config)) valid = false;

            if (!valid) {
                this.bestSolution = null;
                this.emit('SOLUTION_FOUND', { solution: null });
            }
        }
    }

    /**
     * Helper to prune disconnected nodes in a tree.
     */
    pruneOrphans() {
        // Use stored startNodeId instead of hardcoded 0
        const root = this.graph.nodes.get(this.startNodeId);
        if (!root) return; // If root is gone, graph is effectively empty

        const reachable = new Set([root.id]);
        const queue = [root];

        while(queue.length > 0) {
            const curr = queue.shift();
            for (const edgeId of curr.outgoingEdges) {
                const edge = this.graph.edges.get(edgeId);
                if (edge) {
                    const child = this.graph.nodes.get(edge.targetId);
                    if (child && !reachable.has(child.id)) {
                        reachable.add(child.id);
                        queue.push(child);
                    }
                }
            }
        }

        const nodesToRemove = [];
        for (const nodeId of this.graph.nodes.keys()) {
            if (!reachable.has(nodeId)) {
                nodesToRemove.push(nodeId);
            }
        }
        nodesToRemove.forEach(id => this.graph.removeNode(id));
    }

    // ... (isInGoal, getSolution, getStatistics match existing)
    isInGoal(config) {
        for (const region of this.goalRegions) {
            if (region.type === 'circle') {
                const dx = config.x - region.x;
                const dy = config.y - region.y;
                if ((dx*dx + dy*dy) <= region.radius * region.radius) return true;
            } else if (region.type === 'polygon') {
                return false; 
            }
        }
        return false;
    }

    getSolution() { return this.bestSolution; }
    getStatistics() { return this.stats; }
}
