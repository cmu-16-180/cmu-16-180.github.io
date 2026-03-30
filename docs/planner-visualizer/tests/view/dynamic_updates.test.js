import { UI } from '../../js/view/ui.js';
import { RRTConnect } from '../../js/planners/rrt_connect.js';
import { RRT } from '../../js/planners/rrt.js';
import { PRM } from '../../js/planners/prm.js';
import { Graph } from '../../js/core/graph.js';
import { Holonomic2D } from '../../js/robots/holonomic2d.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('Dynamic Graph Updates', () => {
    let ui;
    let mockController;
    let mockRenderer;

    beforeEach(() => {
        setupUIFixture();

        const defaultPlanner = {
             graph: { addEventListener: () => {}, nodes: {size:0}, edges: {size:0}, clear: () => {} },
             robot: { obstacles: [], costRegions: [] },
             initialize: () => {},
             updateParameters: () => {},
             getStatistics: () => ({}),
             getSolution: () => null,
             addEventListener: () => {}
        };

        mockController = {
            planner: defaultPlanner, 
            isRunning: false,
            start: () => {}, stop: () => {}, step: () => {}, setSpeed: () => {}, setPlanner: (p) => { mockController.planner = p; }
        };

        mockRenderer = {
            drawEnvironment: () => {}, updateEnvironment: () => {}, drawSolution: () => {}, setSecondaryGraph: () => {}, drawEllipse: () => {},
            bindPlannerEvents: () => {},
            layers: { rejected: {style:{}}, grid: {style:{}} },
            svg: document.getElementById('workspace-svg'),
            getScreenCTM: () => ({ inverse: () => ({ a:1, b:0, c:0, d:1, e:0, f:0 }) }),
            createShapeElement: () => document.createElement('div')
        };
        mockRenderer.svg.createSVGPoint = () => ({ x:0, y:0, matrixTransform: (m) => ({x:0, y:1000}) });

        ui = new UI(mockController, mockRenderer);
    });

    afterEach(() => {
        teardownUIFixture();
    });

    // ... Tests remain identical logic, just wrapping in new fixture handling ...
    describe('RRT Goal Updates', () => {
        it('should update solution when goal moves to a different branch', () => {
            const robot = new Holonomic2D(0.5);
            const graph = new Graph();
            const planner = new RRT(robot, graph);
            mockController.planner = planner;

            const start = {x:5, y:0};
            const initialGoal = [{type:'circle', x:0, y:0, radius:1}];
            planner.initialize(start, initialGoal);

            const root = graph.nodes.get(0);
            const left = graph.addNode({x:0, y:0});
            left.parentId = root.id; left.cost = 5;
            graph.addEdge(root.id, left.id, 5);

            const right = graph.addNode({x:10, y:0});
            right.parentId = root.id; right.cost = 5;
            graph.addEdge(root.id, right.id, 5);

            planner.checkGoal(left);
            planner.updateGoals([{type:'circle', x:10, y:0, radius:1}]);

            expect(planner.bestSolution).to.not.be.null;
            const endNode = planner.bestSolution.path[planner.bestSolution.path.length - 1];
            expect(endNode.id).to.equal(right.id);
        });
    });

    describe('PRM Goal Updates', () => {
        it('should re-solve when goal moves', () => {
            const robot = new Holonomic2D(0.5);
            const graph = new Graph();
            const planner = new PRM(robot, graph);
            mockController.planner = planner;

            const start = {x:0, y:0};
            planner.initialize(start, [{type:'circle', x:10, y:0, radius:1}]);

            const n1 = graph.addNode({x:10, y:0});
            graph.addEdge(0, n1.id, 10);
            graph.addEdge(n1.id, 0, 10);
            
            planner.solve();
            expect(planner.bestSolution).to.not.be.null;

            planner.updateGoals([{type:'circle', x:0, y:10, radius:1}]);
            expect(planner.bestSolution).to.be.null;

            const n2 = graph.addNode({x:0, y:10});
            graph.addEdge(0, n2.id, 10);
            graph.addEdge(n2.id, 0, 10);

            planner.solve();

            const sol = planner.bestSolution;
            expect(sol).to.not.be.null;
            expect(sol.path[sol.path.length-1].id).to.equal(n2.id);
        });
    });

    describe('Graph Repair (Orphan Pruning)', () => {
        it('should remove orphaned descendants in RRT', () => {
            const robot = new Holonomic2D(0.1);
            const graph = new Graph();
            const planner = new RRT(robot, graph);
            
            const start = {x:0, y:0};
            planner.initialize(start, []);
            const root = graph.nodes.get(0);
            
            const a = graph.addNode({x:5, y:0});
            a.parentId = root.id;
            const e1 = graph.addEdge(root.id, a.id, 5);

            const b = graph.addNode({x:10, y:0});
            b.parentId = a.id;
            const e2 = graph.addEdge(a.id, b.id, 5);

            robot.setEnvironment([{ type: 'circle', x: 2.5, y: 0, radius: 1 }], []);
            planner.repairGraph();

            expect(graph.edges.has(e1.id)).to.be.false;
            expect(graph.nodes.has(a.id)).to.be.false;
            expect(graph.nodes.has(b.id)).to.be.false;
            expect(graph.nodes.has(root.id)).to.be.true;
        });
    });
});
