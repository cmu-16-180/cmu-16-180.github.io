import { RRT } from '../../js/planners/rrt.js';
import { Graph } from '../../js/core/graph.js';
import { Holonomic2D } from '../../js/robots/holonomic2d.js';

const expect = window.chai.expect;

describe('RRT Planner', () => {
    let robot;
    let graph;
    let planner;

    beforeEach(() => {
        // Setup a simple environment
        robot = new Holonomic2D(0.5);
        // No obstacles by default
        robot.setEnvironment([], []);
        graph = new Graph();
        planner = new RRT(robot, graph);
    });

    it('should initialize correctly', () => {
        const start = {x: 1, y: 1};
        const goals = [{type: 'circle', x: 9, y: 9, radius: 1}];
        
        planner.initialize(start, goals);
        
        expect(graph.nodes.size).to.equal(1);
        expect(graph.nodes.get(0).config.x).to.equal(1);
        expect(planner.bestSolution).to.be.null;
    });

    it('should grow the tree when stepping', () => {
        const start = {x: 1, y: 1};
        const goals = [{type: 'circle', x: 9, y: 9, radius: 1}];
        planner.initialize(start, goals);

        // Run a few steps to be safe (randomness)
        for(let i=0; i<10; i++) planner.step();

        expect(graph.nodes.size).to.be.greaterThan(1);
        expect(graph.edges.size).to.be.greaterThan(0);
    });

    it('should find a solution in an empty world', () => {
        const start = {x: 1, y: 1};
        const goals = [{type: 'circle', x: 9, y: 9, radius: 1}];
        planner.initialize(start, goals);
        
        // Increase step size to speed up test
        planner.updateParameters({ stepSize: 2.0, goalBias: 0.2 });

        let solved = false;
        planner.addEventListener('SOLUTION_FOUND', () => {
            solved = true;
        });

        // Run loop (with safety limit)
        for(let i=0; i<500; i++) {
            planner.step();
            if (solved) break;
        }

        expect(solved).to.be.true;
        const sol = planner.getSolution();
        expect(sol).to.not.be.null;
        expect(sol.path.length).to.be.greaterThan(1);
    });

    it('should navigate around obstacles', () => {
        // Scenario: Narrow Corridor-ish
        // Start (1, 5), Goal (9, 5)
        // Obstacle: Circle at (5, 5) radius 2 blocking the direct path
        
        const start = {x: 1, y: 5};
        const goals = [{type: 'circle', x: 9, y: 5, radius: 1}];
        const obstacle = {type: 'circle', x: 5, y: 5, radius: 2};
        
        robot.setEnvironment([obstacle], []);
        planner.initialize(start, goals);
        
        // Use standard step size to force it to "crawl" around
        planner.updateParameters({ stepSize: 1.0, goalBias: 0.1 });

        let solved = false;
        planner.addEventListener('SOLUTION_FOUND', () => {
            solved = true;
        });

        // RRTs can be slow to find narrow passages, but 2000 steps should be plenty for this simple block
        for(let i=0; i<2000; i++) {
            planner.step();
            if (solved) break;
        }

        expect(solved).to.be.true;
        
        // Verify no node in the solution is inside the obstacle
        // (This validates that the planner actually used valid nodes)
        const sol = planner.getSolution();
        for (const node of sol.path) {
            const distSqToObs = (node.config.x - 5)**2 + (node.config.y - 5)**2;
            // Dist must be > radius (2) + robot radius (0.5) = 2.5^2 = 6.25
            // Using slightly loose tolerance for float math
            expect(distSqToObs).to.be.at.least(6.25 - 0.01);
        }
    });

    it('should handle reconnect (smart or reset)', () => {
        const start = {x: 1, y: 1};
        const goals = [{type: 'circle', x: 9, y: 9, radius: 1}];
        planner.initialize(start, goals);
        
        // Add some nodes
        for(let i=0; i<5; i++) planner.step();
        
        // Move robot to new location
        const newStart = {x: 2, y: 2};
        planner.reconnect(newStart);

        // Smart Reconnect logic might keep nodes, or fallback to reset.
        // We assume at least the new start node exists.
        expect(graph.nodes.size).to.be.at.least(1);
        
        // Ensure the planner updated its internal state
        expect(planner.startConfig.x).to.equal(2);
        expect(planner.startConfig.y).to.equal(2);
        
        // Ensure the graph contains the new start node
        let found = false;
        for (const node of graph.nodes.values()) {
            if (node.config.x === 2 && node.config.y === 2) found = true;
        }
        expect(found, "Graph should contain the new start node").to.be.true;
    });

    it('should detect solution on updateGoals if node exists in new goal', () => {
        const start = {x: 1, y: 1};
        // Initial goal far away
        const goals = [{type: 'circle', x: 9, y: 9, radius: 1}];
        planner.initialize(start, goals);

        // Manually add a node at (5,5) simulating exploration
        const root = graph.nodes.get(0);
        const nodeInMiddle = graph.addNode({x: 5, y: 5});
        nodeInMiddle.parentId = root.id;
        nodeInMiddle.cost = 5; 
        graph.addEdge(root.id, nodeInMiddle.id, 5);

        // Now move goal to (5,5)
        const newGoals = [{type: 'circle', x: 5, y: 5, radius: 1}];
        
        let solved = false;
        planner.addEventListener('SOLUTION_FOUND', () => {
            solved = true;
        });

        planner.updateGoals(newGoals);

        expect(solved).to.be.true;
        const sol = planner.getSolution();
        expect(sol.path[sol.path.length-1].id).to.equal(nodeInMiddle.id);
    });
});
