import { UI } from '../../js/view/ui.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';
import { Holonomic2D } from '../../js/robots/holonomic2d.js';
import { DubinsRobot } from '../../js/robots/dubins.js';

const expect = window.chai.expect;

describe('Robot Switching', () => {
    let ui;
    let mockController;
    let mockRenderer;
    let mockPlanner;

    beforeEach(() => {
        setupUIFixture();

        // Mock Planner with Swappable Robot
        mockPlanner = {
            graph: { 
                nodes: { size: 0 }, 
                edges: { size: 0 }, 
                clear: () => {}, 
                addEventListener: () => {},
                // Fix: Add addNode mock for PlannerBase.initialize
                addNode: (config) => ({ id: 0, config }) 
            },
            robot: new Holonomic2D(), 
            startConfig: { x:0, y:0, theta:0 },
            goalRegions: [],
            initialize: () => {},
            updateParameters: () => {},
            getStatistics: () => ({}),
            getSolution: () => null,
            addEventListener: () => {},
            setRobot: function(r) { this.robot = r; } 
        };

        mockController = {
            planner: mockPlanner,
            isRunning: false,
            stop: () => {},
            setPlanner: (p) => { mockController.planner = p; }
        };

        mockRenderer = {
            drawEnvironment: () => {},
            updateEnvironment: () => {},
            drawSolution: () => {},
            setSecondaryGraph: () => {},
            drawEllipse: () => {},
            bindPlannerEvents: () => {},
            layers: { rejected: {style:{}}, grid: {style:{}} },
            svg: document.getElementById('workspace-svg'),
            getScreenCTM: () => ({ inverse: () => ({ a:1, b:0, c:0, d:1, e:0, f:0 }) }),
            createSVGPoint: () => ({ x:0, y:0, matrixTransform: (m) => ({x:0, y:0}) })
        };

        ui = new UI(mockController, mockRenderer);
    });

    afterEach(() => {
        teardownUIFixture();
    });

    it('should switch to Dubins Robot when selected', () => {
        const select = document.getElementById('select-robot');
        
        expect(mockController.planner.robot).to.be.instanceOf(Holonomic2D);

        select.value = 'dubins';
        select.dispatchEvent(new Event('change'));

        expect(mockController.planner.robot).to.be.instanceOf(DubinsRobot);
        expect(mockController.planner.robot.hasOrientation).to.be.true;
    });

    it('should reset parameters (Theta) when switching to Holonomic', () => {
        const select = document.getElementById('select-robot');
        select.value = 'dubins';
        select.dispatchEvent(new Event('change'));
        
        select.value = 'holonomic';
        select.dispatchEvent(new Event('change'));

        expect(mockController.planner.robot).to.be.instanceOf(Holonomic2D);
        expect(mockController.planner.robot.hasOrientation).to.be.false;
    });
});
