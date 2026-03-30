import { UI } from '../../js/view/ui.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('Interactive Updates', () => {
    let ui;
    let mockController;
    let mockPlanner;
    let mockRenderer;

    beforeEach(() => {
        setupUIFixture();

        // Mock Planner with Spies
        mockPlanner = {
            graph: { nodes: { size: 10 }, edges: { size: 9 }, clear: () => {}, addEventListener: () => {} },
            robot: { obstacles: [{x:0, y:0}], costRegions: [], getSample: () => {}, getCollisionShape: ()=>({}) },
            startConfig: {x:0, y:0}, 
            goalRegions: [{x:10, y:10}],
            
            initializeCalls: 0,
            reconnectCalls: 0,
            updateGoalsCalls: 0,
            
            initialize: () => { mockPlanner.initializeCalls++; },
            updateParameters: () => {},
            getStatistics: () => ({}),
            getSolution: () => null,
            addEventListener: () => {},
            reconnect: () => { mockPlanner.reconnectCalls++; },
            updateGoals: () => { mockPlanner.updateGoalsCalls++; },
            repairGraph: () => {} 
        };

        mockController = {
            planner: mockPlanner,
            isRunning: false,
            start: () => {}, stop: () => {}, step: () => {}, setSpeed: () => {}, setPlanner: (p) => { mockController.planner = p; }
        };

        mockRenderer = {
            drawEnvironment: () => {}, updateEnvironment: () => {}, drawSolution: () => {}, setSecondaryGraph: () => {}, drawEllipse: () => {},
            bindPlannerEvents: () => {},
            layers: { rejected: {style:{}}, grid: {style:{}} },
            svg: document.getElementById('workspace-svg')
        };
        // Mock geometry
        mockRenderer.svg.getScreenCTM = () => ({ inverse: () => ({ a:1, b:0, c:0, d:1, e:0, f:0 }) });
        mockRenderer.svg.createSVGPoint = () => ({ x:0, y:0, matrixTransform: (m) => ({x:0, y:1000}) }); 

        ui = new UI(mockController, mockRenderer);
    });

    afterEach(() => {
        teardownUIFixture();
    });

    const simulateDrag = (type, index = 0) => {
        // 1. Manually set selection state on the Interaction Manager
        ui.interaction.selectedObject = { 
            type, 
            index, 
            ref: type === 'robot' ? mockPlanner.startConfig : (type === 'goal' ? mockPlanner.goalRegions[0] : mockPlanner.robot.obstacles[0]) 
        };
        ui.interaction.activeTool = 'select';
        
        // 2. Simulate Mouse Down (on InteractionManager)
        ui.interaction.onMouseDown({ 
            target: { classList: { contains: () => false }, closest: () => false, getAttribute: () => '' }, 
            clientX: 0, clientY: 0,
            preventDefault: () => {}
        });
        
        // Force drag state active (skipping hit test logic in mock)
        ui.interaction.dragState = { active: true, startMouse: {x:0, y:0}, startObj: {x:0, y:0} };

        // 3. Move
        ui.interaction.onMouseMove({ clientX: 10, clientY: 10 });

        // 4. End
        ui.interaction.onMouseUp({});
    };

    it('should call updateGoals when dragging a goal', () => {
        simulateDrag('goal');
        expect(mockPlanner.updateGoalsCalls).to.equal(1);
    });

    it('should call reconnect when dragging the robot', () => {
        simulateDrag('robot');
        expect(mockPlanner.reconnectCalls).to.equal(1);
    });

    it('should full reset when dragging an obstacle', () => {
        let repairCalled = false;
        mockPlanner.repairGraph = () => { repairCalled = true; };

        simulateDrag('obstacle');
        expect(repairCalled).to.be.true;
    });
});
