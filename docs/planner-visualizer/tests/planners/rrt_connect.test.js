import { RRTConnect } from '../../js/planners/rrt_connect.js';
import { Graph } from '../../js/core/graph.js';
import { Holonomic2D } from '../../js/robots/holonomic2d.js';

const expect = window.chai.expect;

describe('RRT-Connect Planner', () => {
    let robot;
    let graph;
    let planner;

    beforeEach(() => {
        robot = new Holonomic2D(0.5);
        robot.setEnvironment([], []);
        graph = new Graph();
        planner = new RRTConnect(robot, graph);
        // Initialize with dummy start/goal
        planner.initialize({x:0, y:0}, [{type: 'circle', x:10, y:0, radius:1}]);
    });

    it('should only update bestSolution if cost improves', () => {
        // Setup: One node in forward tree, nodes in reverse tree
        const n1 = planner.graph.addNode({x:0, y:0});
        n1.cost = 0;
        
        // 1. Found First solution (Total Cost ~10)
        // Bridge n1 (0,0) to n2 (10,0) -> Dist 10
        const n2 = planner.graphReverse.addNode({x:10, y:0});
        n2.cost = 0;

        planner.constructSolution(n1, n2);
        
        expect(planner.bestSolution).to.not.be.null;
        expect(planner.bestSolution.cost).to.be.closeTo(10, 0.1);

        // 2. Found Worse solution (Total Cost ~20)
        // Bridge n1 (0,0) to n3 (20,0) -> Dist 20
        const n3 = planner.graphReverse.addNode({x:20, y:0}); 
        n3.cost = 0;
        
        planner.constructSolution(n1, n3);

        // Expectation: Solution should STILL be the one with cost 10
        expect(planner.bestSolution.cost).to.be.closeTo(10, 0.1, "Should preserve better solution");

        // 3. Found Better solution (Total Cost ~5)
        // Bridge n1 (0,0) to n4 (5,0) -> Dist 5
        const n4 = planner.graphReverse.addNode({x:5, y:0});
        n4.cost = 0;

        planner.constructSolution(n1, n4);

        // Expectation: Solution should update to cost 5
        expect(planner.bestSolution.cost).to.be.closeTo(5, 0.1, "Should update to better solution");
    });
});
