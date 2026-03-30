import { RRT } from '../../js/planners/rrt.js';
import { PRM } from '../../js/planners/prm.js';
import { Graph } from '../../js/core/graph.js';
import { Holonomic2D } from '../../js/robots/holonomic2d.js';

const expect = window.chai.expect;

describe('Planner Reconnect Logic', () => {
    let robot;
    let graph;

    beforeEach(() => {
        robot = new Holonomic2D(1.0); // 1m radius
        robot.setEnvironment([], []); // Empty world
        graph = new Graph();
    });

    describe('RRT Reconnect', () => {
        it('should preserve reachable branches when moving root', () => {
            const planner = new RRT(robot, graph);
            
            // Setup Tree: Root(0,0) -> A(5,0) -> B(10,0)
            const start = {x:0, y:0};
            planner.initialize(start, []);
            
            const root = graph.nodes.get(0);
            const a = graph.addNode({x:5, y:0});
            a.parentId = root.id;
            graph.addEdge(root.id, a.id, 5);
            
            const b = graph.addNode({x:10, y:0});
            b.parentId = a.id;
            graph.addEdge(a.id, b.id, 5);

            expect(graph.nodes.size).to.equal(3);

            // Move Robot to (5, 1) - Close to A (dist 1.0)
            // Should connect to A.
            const newStart = {x:5, y:1};
            
            planner.reconnect(newStart);

            // Expect NewRoot, A, B. (Old Root gone).
            expect(graph.nodes.size).to.be.at.least(2, "Should have preserved some nodes");

            // New Start Node should exist
            let newRoot = null;
            for(const node of graph.nodes.values()) {
                if (node.config.x === 5 && node.config.y === 1) newRoot = node;
            }
            expect(newRoot).to.not.be.null;
            expect(newRoot.parentId).to.be.null;

            // Node A (5,0) should still exist
            let nodeA = null;
            for(const node of graph.nodes.values()) {
                if (node.config.x === 5 && node.config.y === 0) nodeA = node;
            }
            expect(nodeA).to.not.be.null;
            
            // Node A should be child of New Root
            expect(nodeA.parentId).to.equal(newRoot.id);
            
            // Old Root (0,0) should be gone (pruned)
            let oldRootExists = false;
            for(const node of graph.nodes.values()) {
                if (node.config.x === 0 && node.config.y === 0) oldRootExists = true;
            }
            expect(oldRootExists).to.be.false;
        });
    });

    describe('PRM Reconnect', () => {
        it('should preserve roadmap but replace start node', () => {
            const planner = new PRM(robot, graph);
            
            // Setup: Start(0,0), Neighbor(5,0)
            const start = {x:0, y:0};
            planner.initialize(start, []);
            
            // Add neighbor
            const n1 = graph.addNode({x:5, y:0});
            graph.addEdge(0, n1.id, 5);
            graph.addEdge(n1.id, 0, 5);
            
            const oldStartId = 0;
            expect(graph.nodes.has(oldStartId)).to.be.true;
            expect(graph.nodes.size).to.equal(2);

            // Move Robot closer to N1 to ensure connection
            // N1 is at (5,0). Dist to (4,0) is 1.0. Radius is 2.0.
            const newStart = {x:4, y:0}; 
            planner.reconnect(newStart);

            // 1. Old start should be gone
            expect(graph.nodes.has(oldStartId)).to.be.false;

            // 2. Neighbor (5,0) should remain
            expect(graph.nodes.has(n1.id)).to.be.true;

            // 3. New start should exist
            let newRoot = null;
            for(const node of graph.nodes.values()) {
                if (node.config.x === 4 && node.config.y === 0) newRoot = node;
            }
            expect(newRoot).to.not.be.null;

            // 4. New start should be connected to N1
            expect(newRoot.outgoingEdges.size).to.be.greaterThan(0);
        });
    });
});
