// ... imports
import { PlannerBase } from './planner_base.js';

class PriorityQueue {
    constructor() { this.elements = []; }
    enqueue(item, priority) {
        this.elements.push({ item, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() { return this.elements.shift().item; }
    isEmpty() { return this.elements.length === 0; }
}

export class PRM extends PlannerBase {
    constructor(robot, graph) {
        super(robot, graph);
        this.connectionRadius = 2.0;
        this.kNeighbors = 10;
    }

    updateParameters(params) {
        super.updateParameters(params);
        if (params.connectionRadius !== undefined) this.connectionRadius = params.connectionRadius;
        if (params.kNeighbors !== undefined) this.kNeighbors = params.kNeighbors;
    }

    updateGoals(newGoalRegions) {
        super.updateGoals(newGoalRegions);
        this.solve();
    }
    
    repairGraph() {
        super.repairGraph();
        this.solve(); 
    }

    // Smart Reconnect for PRM
    reconnect(newStart) {
        // 1. Remove old start node
        if (this.startNodeId !== null) {
            this.graph.removeNode(this.startNodeId);
        }

        // 2. Add new start node
        const newStartNode = this.graph.addNode(newStart);
        this.startNodeId = newStartNode.id;
        this.startConfig = newStart;

        // 3. Connect new start to roadmap
        // Reuse step logic essentially, but only for start node
        let neighbors = this.graph.getNodesWithinDistance(newStart, this.connectionRadius, this.robot);
        neighbors.sort((a, b) => {
            const da = this.robot.distance(newStart, a.config);
            const db = this.robot.distance(newStart, b.config);
            return da - db;
        });
        if (neighbors.length > this.kNeighbors) neighbors = neighbors.slice(0, this.kNeighbors);

        for (const neighbor of neighbors) {
            if (neighbor.id === newStartNode.id) continue;
            const d = this.robot.distance(neighbor.config, newStart);
            const steerRes = this.robot.steer(neighbor.config, newStart, d); 
            if (this.robot.isValidLink(neighbor.config, newStart, steerRes.path)) {
                const edgeCost = this.robot.cost(neighbor.config, newStart, steerRes.path);
                this.graph.addEdge(neighbor.id, newStartNode.id, edgeCost);
                this.graph.addEdge(newStartNode.id, neighbor.id, edgeCost);
            }
        }

        // 4. Resolve
        this.solve();
    }

    // ... step, solve, reconstructPath (same as before)
    step() {
        const q_rand = this.robot.getSample(this.sampler, this.stats.nodesVisited, this.rng);
        if (!this.robot.isValidConfig(q_rand)) {
            this.emit('SAMPLE_REJECTED', { type: 'node', config: q_rand });
            return;
        }

        const newNode = this.graph.addNode(q_rand);
        this.stats.nodesVisited++;

        let neighbors = this.graph.getNodesWithinDistance(q_rand, this.connectionRadius, this.robot);
        
        neighbors.sort((a, b) => {
            const da = this.robot.distance(q_rand, a.config);
            const db = this.robot.distance(q_rand, b.config);
            return da - db;
        });

        if (neighbors.length > this.kNeighbors) {
            neighbors = neighbors.slice(0, this.kNeighbors);
        }

        for (const neighbor of neighbors) {
            if (neighbor.id === newNode.id) continue;

            const d = this.robot.distance(neighbor.config, q_rand);
            const steerRes = this.robot.steer(neighbor.config, q_rand, d); 
            
            if (this.robot.isValidLink(neighbor.config, q_rand, steerRes.path)) {
                const edgeCost = this.robot.cost(neighbor.config, q_rand, steerRes.path);
                this.graph.addEdge(neighbor.id, newNode.id, edgeCost);
                this.graph.addEdge(newNode.id, neighbor.id, edgeCost);
            } else {
                 this.emit('SAMPLE_REJECTED', { type: 'edge', from: neighbor.config, to: q_rand });
            }
        }

        this.solve();
        this.emit('STEP_COMPLETE');
    }

    solve() {
        const goalNodes = [];
        for (const node of this.graph.nodes.values()) {
            if (this.isInGoal(node.config)) goalNodes.push(node);
        }
        
        if (goalNodes.length === 0) {
            if (this.bestSolution) {
                this.bestSolution = null;
                this.emit('SOLUTION_FOUND', { solution: null });
            }
            return; 
        }

        const startNode = this.graph.nodes.get(this.startNodeId); // Use tracked ID
        if (!startNode) return;

        const openSet = new PriorityQueue();
        openSet.enqueue(startNode, 0);
        const cameFrom = new Map(); 
        const gScore = new Map();   
        gScore.set(startNode.id, 0);

        let foundGoalNode = null;

        const getEdgeCost = (u, v) => {
            for (const edgeId of u.outgoingEdges) {
                const edge = this.graph.edges.get(edgeId);
                if (edge.targetId === v.id) return edge.cost;
            }
            return Infinity; 
        };

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();
            if (this.isInGoal(current.config)) {
                foundGoalNode = current;
                break;
            }

            const currentG = gScore.get(current.id);
            const neighbors = this.graph.getNeighbors(current.id);

            for (const neighbor of neighbors) {
                const d = getEdgeCost(current, neighbor);
                const tentativeG = currentG + d;

                if (!gScore.has(neighbor.id) || tentativeG < gScore.get(neighbor.id)) {
                    cameFrom.set(neighbor.id, current.id);
                    gScore.set(neighbor.id, tentativeG);
                    
                    let minH = Infinity;
                    const minMultiplier = 0.1; 
                    
                    for (const region of this.goalRegions) {
                        const center = region.type === 'circle' ? region : region.points[0];
                        const h = this.robot.distance(neighbor.config, {x:center.x, y:center.y});
                        if (h < minH) minH = h;
                    }
                    
                    openSet.enqueue(neighbor, tentativeG + (minH * minMultiplier));
                }
            }
        }

        if (foundGoalNode) {
            this.reconstructPath(cameFrom, foundGoalNode, gScore.get(foundGoalNode.id));
        } else {
            if (this.bestSolution) {
                this.bestSolution = null;
                this.emit('SOLUTION_FOUND', { solution: null });
            }
        }
    }

    reconstructPath(cameFrom, current, totalCost) {
        const path = [current];
        while (cameFrom.has(current.id)) {
            const parentId = cameFrom.get(current.id);
            current = this.graph.nodes.get(parentId);
            path.unshift(current);
        }
        if (!this.bestSolution || totalCost < this.bestSolution.cost) {
            this.bestSolution = {
                path: path,
                cost: totalCost,
                segments: path.length - 1
            };
            this.emit('SOLUTION_FOUND', { solution: this.bestSolution });
        }
    }
}
