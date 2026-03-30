// ... imports ...
import { RRT } from './rrt.js';
import { dist, interpolateConfig } from '../utils/geometry.js';

export class RRTStar extends RRT {
    constructor(robot, graph) {
        super(robot, graph);
        this.rewireRadius = 2.0; 
        this.informed = false;   
    }

    updateParameters(params) {
        super.updateParameters(params);
        if (params.rewireRadius !== undefined) this.rewireRadius = params.rewireRadius;
        if (params.informed !== undefined) this.informed = params.informed;
    }

    step() {
        // 1. Sample
        let q_rand;
        if (this.informed && this.bestSolution) {
            q_rand = this.getInformedSample();
        } else {
            q_rand = super.getSampleWithBias(); 
        }

        // 2. Nearest
        const nearest = this.graph.getNearestNode(q_rand, this.robot);
        if (!nearest) return;

        // 3. Steer
        const steerResult = this.robot.steer(nearest.node.config, q_rand, this.stepSize);
        const q_new = steerResult.endConfig;

        // 4. Collision Check
        if (!this.robot.isValidConfig(q_new)) {
             this.emit('SAMPLE_REJECTED', { type: 'node', config: q_new });
             return;
        }

        // 5. Find Best Parent
        const neighbors = this.graph.getNodesWithinDistance(q_new, this.rewireRadius, this.robot);
        
        let minCost = nearest.node.cost + steerResult.cost;
        let bestParent = nearest.node;
        let bestPathData = steerResult.path;

        // Initial link check for 'nearest' (fallback)
        // If we don't pick a better neighbor, we rely on this one.
        // We verify link validity below.

        for (const neighbor of neighbors) {
            const d = this.robot.distance(neighbor.config, q_new);
            const neighborSteer = this.robot.steer(neighbor.config, q_new, d); 
            
            if (neighbor.cost + neighborSteer.cost < minCost) {
                if (this.robot.isValidLink(neighbor.config, q_new, neighborSteer.path)) {
                    minCost = neighbor.cost + neighborSteer.cost;
                    bestParent = neighbor;
                    bestPathData = neighborSteer.path;
                } else {
                    // Don't emit rejection for rewiring candidates as it clutters view
                    // Only emit for the primary extension attempt if it fails completely
                }
            }
        }

        // If best parent is still nearest, we must validate the link now
        if (bestParent === nearest.node) {
             if (!this.robot.isValidLink(bestParent.config, q_new, bestPathData)) {
                 this.emit('SAMPLE_REJECTED', { type: 'edge', from: bestParent.config, to: q_new });
                 return;
             }
        }

        // 6. Add Node
        const newNode = this.graph.addNode(q_new);
        newNode.parentId = bestParent.id;
        newNode.cost = minCost;
        const edgeCost = minCost - bestParent.cost;
        this.graph.addEdge(bestParent.id, newNode.id, edgeCost);
        this.stats.nodesVisited++;

        // 7. Rewire
        this.rewire(newNode, neighbors);

        // 8. Check Solution
        this.checkGoal(newNode);
        
        this.emit('STEP_COMPLETE');
    }

    // ... (rewire, propagateCost, getInformedSample, getInformedEllipse remain same) ...
    rewire(newNode, neighbors) {
        for (const neighbor of neighbors) {
            if (neighbor.id === newNode.parentId) continue;

            const d = this.robot.distance(newNode.config, neighbor.config);
            const steerRes = this.robot.steer(newNode.config, neighbor.config, d);
            
            const newPotentialCost = newNode.cost + steerRes.cost;

            if (newPotentialCost < neighbor.cost) {
                if (this.robot.isValidLink(newNode.config, neighbor.config, steerRes.path)) {
                    const incoming = [...neighbor.incomingEdges];
                    if (incoming.length > 0) {
                        this.graph.removeEdge(incoming[0]); 
                    }

                    neighbor.parentId = newNode.id;
                    neighbor.cost = newPotentialCost;
                    this.graph.addEdge(newNode.id, neighbor.id, steerRes.cost);

                    this.propagateCost(neighbor);
                }
            }
        }
    }

    propagateCost(node) {
        const queue = [node];
        while (queue.length > 0) {
            const curr = queue.shift();
            const edges = [...curr.outgoingEdges].map(id => this.graph.edges.get(id));
            for (const edge of edges) {
                const child = this.graph.nodes.get(edge.targetId);
                child.cost = curr.cost + edge.cost;
                queue.push(child);
            }
        }
    }

    getInformedSample() {
        const start = this.startConfig;
        const goal = this.goalRegions[0]; 
        
        const cBest = this.bestSolution.cost;
        const cMin = this.robot.distance(start, {x: goal.x, y: goal.y}); 

        if (cBest < cMin) return super.getSampleWithBias(); 

        const center = {
            x: (start.x + goal.x) / 2,
            y: (start.y + goal.y) / 2
        };
        const angle = Math.atan2(goal.y - start.y, goal.x - start.x);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const r1 = cBest / 2;
        const term = cBest*cBest - cMin*cMin;
        const r2 = term > 0 ? Math.sqrt(term) / 2 : 0;

        const r = Math.sqrt(this.rng.next());
        const theta = this.rng.next() * 2 * Math.PI;
        const xUnit = r * Math.cos(theta);
        const yUnit = r * Math.sin(theta);

        const xScale = xUnit * r1;
        const yScale = yUnit * r2;

        const xFinal = center.x + (xScale * cos - yScale * sin);
        const yFinal = center.y + (xScale * sin + yScale * cos);

        return { x: xFinal, y: yFinal };
    }

    getInformedEllipse() {
        if (!this.bestSolution || !this.informed) return null;
        const start = this.startConfig;
        const goal = this.goalRegions[0];
        const cBest = this.bestSolution.cost;
        const cMin = this.robot.distance(start, {x: goal.x, y: goal.y});
        
        const term = cBest*cBest - cMin*cMin;
        
        return {
            cx: (start.x + goal.x) / 2,
            cy: (start.y + goal.y) / 2,
            rx: cBest / 2,
            ry: term > 0 ? Math.sqrt(term) / 2 : 0,
            rotation: Math.atan2(goal.y - start.y, goal.x - start.x) * (180 / Math.PI)
        };
    }
}
