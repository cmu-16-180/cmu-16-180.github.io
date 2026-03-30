import { UI } from '../../js/view/ui.js';
import { RRT } from '../../js/planners/rrt.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('Parameter Consistency', () => {
    let ui;
    let mockController;
    let mockRenderer;

    beforeEach(() => {
        setupUIFixture();

        // Mock Controller/Planner stack
        const mockPlanner = new RRT({ 
            setEnvironment: ()=>{}, 
            getSample: ()=>{}, 
            getCollisionShape: ()=>({}),
            distance: () => 0
        }, { 
            nodes: new Map(), 
            edges: new Map(), 
            clear: ()=>{}, 
            addEventListener: ()=>{},
            addNode: (config) => ({ id: 0, config: config }),
            addEdge: () => {}
        });
        
        mockPlanner.initialize({}, []);

        mockController = {
            planner: mockPlanner,
            isRunning: false,
            stop: () => {},
            setPlanner: (p) => { mockController.planner = p; },
            setSpeed: () => {}
        };

        mockRenderer = {
            setSecondaryGraph: () => {},
            drawSolution: () => {},
            drawEnvironment: () => {},
            updateEnvironment: () => {},
            drawEllipse: () => {}, 
            bindPlannerEvents: () => {},
            layers: { 
                rejected: { style: {} }, 
                grid: { style: {} }      
            } 
        };

        ui = new UI(mockController, mockRenderer);
    });

    afterEach(() => {
        teardownUIFixture();
    });

    it('should apply existing UI parameter values when switching planners', () => {
        // Pre-condition: Change a value in the DOM so it's not default
        const input = document.getElementById('input-step-size');
        input.value = "1.5";
        
        const select = document.getElementById('select-planner');
        select.value = 'rrt_star';
        select.dispatchEvent(new Event('change'));

        const newPlanner = mockController.planner;
        expect(newPlanner.stepSize).to.equal(1.5, 'Step Size should match UI');
    });
});
