import { UI } from '../../js/view/ui.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('Orientation Controls', () => {
    let ui;
    let mockController;
    let mockRenderer;
    let mockRobot;

    beforeEach(() => {
        setupUIFixture();

        // 1. Mock Robot with Orientation support
        mockRobot = {
            hasOrientation: true, // Key property used by UI to decide whether to show slider
            obstacles: [],
            costRegions: [],
            getSample: () => {},
            getCollisionShape: () => ({ type: 'rect', x:0, y:0, width:1, height:0.5 }),
            setEnvironment: () => {}
        };

        // 2. Mock Planner
        const mockPlanner = {
            graph: { nodes: { size: 0 }, edges: { size: 0 }, clear: () => {}, addEventListener: () => {} },
            startConfig: { x: 5, y: 5, theta: 0 }, // Initial theta
            goalRegions: [],
            robot: mockRobot,
            initialize: () => {},
            updateParameters: () => {},
            getStatistics: () => ({ nodesVisited: 0, edgesEvaluated: 0 }),
            getSolution: () => null,
            addEventListener: () => {},
            reconnect: (cfg) => { mockPlanner.startConfig = cfg; }, // Mock reconnect updates state
            updateGoals: () => {}
        };

        // 3. Controller
        mockController = {
            planner: mockPlanner,
            isRunning: false,
            start: () => {}, stop: () => {}, step: () => {}, setSpeed: () => {}, setPlanner: (p) => { mockController.planner = p; }
        };

        mockRenderer = {
            drawEnvironment: () => {}, updateEnvironment: () => {}, drawSolution: () => {}, setSecondaryGraph: () => {}, drawEllipse: () => {},
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

    it('should show Theta slider when selecting a robot with orientation support', () => {
        // Trigger selection of Robot
        ui.interaction.select('robot', -1, mockController.planner.startConfig);
        
        // Simulate event calling onObjectSelected
        ui.onObjectSelected(ui.interaction.selectedObject);

        // Check if context panel has theta input
        // Note: The UI helper `addSlider` usually creates an input with class `slider-properties`.
        // We'll rely on the ID `input-theta` which we will implement.
        const thetaInput = document.getElementById('input-theta');
        expect(thetaInput).to.exist;
    });

    it('should update robot theta when slider changes', () => {
        // Select robot
        ui.interaction.select('robot', -1, mockController.planner.startConfig);
        ui.onObjectSelected(ui.interaction.selectedObject);

        const thetaInput = document.getElementById('input-theta');
        const thetaVal = document.getElementById('val-theta');

        // Change value to 90 degrees (which corresponds to ~1.57 radians)
        // We use a value that aligns with the step size (e.g. 5) to avoid rounding issues in the test
        thetaInput.value = "90";
        thetaInput.dispatchEvent(new Event('input'));

        // Verify Model Updated (1.5707... radians)
        expect(mockController.planner.startConfig.theta).to.be.closeTo(1.5707, 0.001);
        
        // Verify UI Label Updated
        expect(thetaVal.textContent).to.include("90"); // Degrees
    });
});
