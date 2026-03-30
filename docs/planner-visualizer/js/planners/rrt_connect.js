// ... imports ...
import { PlannerBase } from './planner_base.js';
import { Graph } from '../core/graph.js'; 

export class RRTConnect extends PlannerBase {
    constructor(robot, graph) {
        super(robot, graph);
        this.graphReverse = new Graph();
        this.stepSize = 0.5;
        this.greedy = true;
    }
    
    // ... initialize, initReverseGraph, updateGoals, step, extend, connect, constructSolution ...
    // PRESERVING EXISTING METHODS, updating repairGraph

    initialize(startConfig, goalRegions) {
        super.initialize(startConfig, goalRegions);
        this.initReverseGraph(goalRegions);
    }
    
    initReverseGraph(goalRegions) {
        this.graphReverse.clear();
        for (const region of goalRegions) {
            let rootConfig;
            if (region.type === 'circle') {
                rootConfig = { x: region.x, y: region.y };
            } else {
                rootConfig = region.points[0]; 
            }
            const node = this.graphReverse.addNode(rootConfig);
            node.parentId = null;
            node.cost = 0; 
        }
    }

    updateGoals(newGoalRegions) {
        super.updateGoals(newGoalRegions);
        this.initReverseGraph(newGoalRegions);
        // Clear solution because reverse tree is gone
        this.bestSolution = null;
        this.emit('SOLUTION_FOUND', { solution: null });
    }

    step() {
        const q_rand = this.robot.getSample(this.sampler, this.stats.nodesVisited, this.rng);

        const statusA = this.extend(this.graph, q_rand);

        if (statusA !== 'TRAPPED') {
            const nodeA = this.graph.nodes.get(this.graph.nodeIdCounter - 1);
            const statusB = this.connect(this.graphReverse, nodeA.config);

            if (statusB === 'CONNECTED') {
                this.constructSolution(nodeA, this.graphReverse.nodes.get(this.graphReverse.nodeIdCounter - 1));
            }
        }
        this.emit('STEP_COMPLETE');
    }

    extend(graph, q_target) {
        const nearest = graph.getNearestNode(q_target, this.robot);
        const steerRes = this.robot.steer(nearest.node.config, q_target, this.stepSize);
        const q_new = steerRes.endConfig;

        if (this.robot.isValidConfig(q_new)) {
             // Valid
        } else {
             this.emit('SAMPLE_REJECTED', { type: 'node', config: q_new });
             return 'TRAPPED';
        }

        if (!this.robot.isValidLink(nearest.node.config, q_new, steerRes.path)) {
             this.emit('SAMPLE_REJECTED', { type: 'edge', from: nearest.node.config, to: q_new });
             return 'TRAPPED';
        }

        const newNode = graph.addNode(q_new);
        newNode.parentId = nearest.node.id;
        newNode.cost = nearest.node.cost + steerRes.cost;
        graph.addEdge(nearest.node.id, newNode.id, steerRes.cost);
        this.stats.nodesVisited++;
        return 'ADVANCED';
    }

    connect(graph, q_target) {
        let status = 'ADVANCED';
        while (status === 'ADVANCED') {
            const lastNode = graph.nodes.get(graph.nodeIdCounter - 1);
            const dist = this.robot.distance(lastNode.config, q_target);
            
            if (dist < 0.01) { 
                return 'CONNECTED';
            }
            
            status = this.extend(graph, q_target);
            if (!this.greedy) break;
        }
        return status;
    }

    constructSolution(nodeForward, nodeReverse) {
        const pathA = this.graph.getPathToRoot(nodeForward.id);
        const pathB = this.graphReverse.getPathToRoot(nodeReverse.id);
        const finalPath = [...pathA, ...pathB.reverse()];

        let cost = nodeForward.cost + nodeReverse.cost; 
        
        const d = this.robot.distance(nodeForward.config, nodeReverse.config);
        const bridgeSteer = this.robot.steer(nodeForward.config, nodeReverse.config, d);
        cost += bridgeSteer.cost;

        if (!this.bestSolution || cost < this.bestSolution.cost) {
            this.bestSolution = {
                path: finalPath,
                cost: cost,
                segments: finalPath.length - 1
            };
            this.emit('SOLUTION_FOUND', { solution: this.bestSolution });
        }
    }
    
    reconnect(newStart) {
        this.graph.clear();
        this.graphReverse.clear();
        this.initialize(newStart, this.goalRegions);
    }
    
    repairGraph() {
        super.repairGraph(); // Prunes forward tree
        this.pruneOrphans(); // Forward tree pruning

        // Prune Reverse Tree
        // Cannot use pruneOrphans because it assumes root is ID 0.
        // Reverse tree roots are the first nodes added (ID 0..K).
        // Let's implement custom pruning for reverse tree or generalize prune.
        
        // General Prune logic for graphReverse:
        // Find roots (nodes with parentId null).
        const roots = [];
        for(const node of this.graphReverse.nodes.values()) {
            if (node.parentId === null) roots.push(node);
        }
        
        const reachable = new Set();
        const queue = [...roots];
        roots.forEach(n => reachable.add(n.id));

        while(queue.length > 0) {
            const curr = queue.shift();
            for (const edgeId of curr.outgoingEdges) {
                const edge = this.graphReverse.edges.get(edgeId);
                if (edge) {
                    const child = this.graphReverse.nodes.get(edge.targetId);
                    if (child && !reachable.has(child.id)) {
                        reachable.add(child.id);
                        queue.push(child);
                    }
                }
            }
        }
        
        const nodesToRemove = [];
        for (const nodeId of this.graphReverse.nodes.keys()) {
            if (!reachable.has(nodeId)) nodesToRemove.push(nodeId);
        }
        nodesToRemove.forEach(id => this.graphReverse.removeNode(id));
    }
}
