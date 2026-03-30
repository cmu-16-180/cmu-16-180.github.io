// ... imports
import { PlannerBase } from './planner_base.js';
import { distSq } from '../utils/geometry.js';
import { pointInPolygon } from '../utils/collision.js';

export class RRT extends PlannerBase {
    constructor(robot, graph) {
        super(robot, graph);
        this.stepSize = 0.5;
        this.goalBias = 0.05; 
    }

    updateParameters(params) {
        super.updateParameters(params);
        if (params.stepSize !== undefined) this.stepSize = params.stepSize;
        if (params.goalBias !== undefined) this.goalBias = params.goalBias;
    }

    // Smart Reconnect
    reconnect(newStartConfig) {
        // 1. Find nearest node in existing tree
        const nearest = this.graph.getNearestNode(newStartConfig, this.robot);
        
        // 2. Try to connect newStart -> Nearest
        if (nearest) {
            const d = this.robot.distance(newStartConfig, nearest.node.config);
            const steerRes = this.robot.steer(newStartConfig, nearest.node.config, d);

            if (this.robot.isValidConfig(newStartConfig) && 
                this.robot.isValidLink(newStartConfig, nearest.node.config, steerRes.path)) {
                
                // 3. Success: Modify Tree
                // Remove old start node if different (handled by pruning later)
                
                // Add new start node
                const newRoot = this.graph.addNode(newStartConfig);
                newRoot.cost = 0;
                newRoot.parentId = null;
                
                // Connect newRoot -> Nearest
                // Note: Nearest becomes a child of newRoot. 
                // We need to re-parent nearest and propagate costs.
                // NOTE: This reverses the edge if Nearest had a parent. 
                // However, RRT edges are directed. 
                // The simplest "Smart" reconnect is attaching NewRoot to an existing node 
                // effectively grafting the new root onto the tree.
                // BUT, `nearest` has a parent. We can't just set `nearest.parent = newRoot` 
                // without breaking the tree structure above `nearest`.
                // For a proper re-rooting, we'd need to reverse edges up to the old root.
                // 
                // Simplification for MVP/Educational Tool:
                // We only keep the subtree rooted at `nearest`. 
                // Everything else (including old root) is pruned.
                
                // 1. Break old parent link
                if (nearest.node.incomingEdges.size > 0) {
                    const oldEdgeId = nearest.node.incomingEdges.values().next().value;
                    this.graph.removeEdge(oldEdgeId);
                }
                
                // 2. Link NewRoot -> Nearest
                this.graph.addEdge(newRoot.id, nearest.node.id, steerRes.cost);
                nearest.node.parentId = newRoot.id;
                
                // 3. Update Start ID
                this.startNodeId = newRoot.id;
                this.startConfig = newStartConfig;
                
                // 4. Update Costs (BFS)
                this.propagateCost(newRoot);
                
                // 5. Prune nodes not reachable from NewRoot (e.g. Old Root)
                this.pruneOrphans();
                
                // 6. Check goal
                // We might have lost the solution path if we pruned the branch with the solution
                // Or solution might be valid but with new cost
                // We need to rescan
                this.bestSolution = null;
                this.emit('SOLUTION_FOUND', { solution: null });
                for(const node of this.graph.nodes.values()) {
                    this.checkGoal(node);
                }
                return;
            }
        }

        // Fallback: Full Reset
        super.reconnect(newStartConfig);
    }
    
    propagateCost(node) {
        const queue = [node];
        while (queue.length > 0) {
            const curr = queue.shift();
            const edges = [...curr.outgoingEdges].map(id => this.graph.edges.get(id));
            for (const edge of edges) {
                const child = this.graph.nodes.get(edge.targetId);
                if (child) {
                    child.cost = curr.cost + edge.cost;
                    queue.push(child);
                }
            }
        }
    }

    updateGoals(newGoalRegions) {
        super.updateGoals(newGoalRegions);
        // 1. Check if old solution is still valid
        if (this.bestSolution) {
            const endNode = this.bestSolution.path[this.bestSolution.path.length - 1];
            if (!this.isInGoal(endNode.config)) {
                this.bestSolution = null;
                this.emit('SOLUTION_FOUND', { solution: null });
            }
        }
        // 2. Scan tree
        for (const node of this.graph.nodes.values()) {
            this.checkGoal(node);
        }
    }

    repairGraph() {
        super.repairGraph(); // Removes invalid edges
        this.pruneOrphans(); // Removes disconnected nodes
    }

    // ... getSampleWithBias, step, checkGoal (same as before)
    getSampleWithBias() {
        if (this.rng.next() < this.goalBias && this.goalRegions.length > 0) {
            const idx = Math.floor(this.rng.next() * this.goalRegions.length);
            const region = this.goalRegions[idx];
            if (region.type === 'circle') {
                return { x: region.x, y: region.y }; 
            } else {
                return region.points ? region.points[0] : {x:0, y:0};
            }
        } else {
            return this.robot.getSample(this.sampler, this.stats.nodesVisited, this.rng); 
        }
    }

    step() {
        const q_rand = this.getSampleWithBias();
        const nearest = this.graph.getNearestNode(q_rand, this.robot);
        if (!nearest) return; 

        const steerResult = this.robot.steer(nearest.node.config, q_rand, this.stepSize);
        const q_new = steerResult.endConfig;

        if (!this.robot.isValidConfig(q_new)) {
            this.emit('SAMPLE_REJECTED', { type: 'node', config: q_new });
            return;
        }
        if (!this.robot.isValidLink(nearest.node.config, q_new, steerResult.path)) {
            this.emit('SAMPLE_REJECTED', { type: 'edge', from: nearest.node.config, to: q_new });
            return;
        }

        const newNode = this.graph.addNode(q_new);
        newNode.parentId = nearest.node.id;
        newNode.cost = nearest.node.cost + steerResult.cost;
        
        this.graph.addEdge(nearest.node.id, newNode.id, steerResult.cost);
        this.stats.nodesVisited++;

        this.checkGoal(newNode);
        
        this.emit('STEP_COMPLETE');
    }

    checkGoal(node) {
        if (this.isInGoal(node.config)) {
            const pathNodes = this.graph.getPathToRoot(node.id);
            if (!this.bestSolution || node.cost < this.bestSolution.cost) {
                this.bestSolution = {
                    path: pathNodes,
                    cost: node.cost,
                    segments: pathNodes.length - 1
                };
                this.emit('SOLUTION_FOUND', { solution: this.bestSolution });
            }
            return true;
        }
        return false;
    }
}
