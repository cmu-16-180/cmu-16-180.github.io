import { UI } from '../../js/view/ui.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('UI Manager', () => {
    let ui;
    let mockController;
    let mockRenderer;
    let mockPlanner;

    beforeEach(() => {
        setupUIFixture();

        // Mock Planner
        mockPlanner = {
            graph: {
                nodes: { size: 0 },
                edges: { size: 0 },
                clear: () => {},
                addEventListener: () => {}
            },
            startConfig: { x:0, y:0 },
            goalRegions: [],
            robot: {
                obstacles: [],
                costRegions: [],
                getSample: () => {},
                getCollisionShape: ()=>({})
            },
            initialize: () => {},
            updateParameters: () => {},
            getStatistics: () => ({ nodesVisited: 0, edgesEvaluated: 0 }),
            getSolution: () => null,
            addEventListener: () => {} 
        };

        // Mock Controller
        mockController = {
            planner: mockPlanner,
            isRunning: false,
            start: () => { mockController.isRunning = true; },
            stop: () => { mockController.isRunning = false; },
            step: () => {},
            setSpeed: () => {},
            setPlanner: (p) => { mockController.planner = p; }
        };

        // Mock Renderer
        mockRenderer = {
            drawEnvironment: () => {},
            updateEnvironment: () => {},
            drawSolution: () => {},
            setSecondaryGraph: () => {},
            drawEllipse: () => {},
            bindPlannerEvents: () => {},
            layers: {
                rejected: document.getElementById('layer-rejected'),
                grid: document.getElementById('bg-grid')
            }
        };

        ui = new UI(mockController, mockRenderer);
    });

    afterEach(() => {
        teardownUIFixture();
    });

    it('should initialize without errors', () => {
        expect(ui).to.exist;
    });

    it('should toggle run button state', () => {
        const btn = document.getElementById('btn-run');
        const text = document.getElementById('text-run');
        
        expect(text.textContent).to.include("Run");
        
        btn.click();
        expect(mockController.isRunning).to.be.true;
        expect(text.textContent).to.include("Stop");
        
        btn.click();
        expect(mockController.isRunning).to.be.false;
        expect(text.textContent).to.include("Run");
    });

    it('should update step size parameter', () => {
        const input = document.getElementById('input-step-size');
        const span = document.getElementById('val-step-size');
        
        let calledWith = null;
        mockPlanner.updateParameters = (p) => { calledWith = p; };

        input.value = "1.5";
        input.dispatchEvent(new Event('input', { bubbles: true }));

        expect(span.textContent).to.equal("1.5m");
        expect(calledWith).to.deep.equal({ stepSize: 1.5 });
    });
});
