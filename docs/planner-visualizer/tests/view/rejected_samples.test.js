import { UI } from '../../js/view/ui.js';
import { Renderer } from '../../js/view/renderer.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('Rejected Sample Visualization', () => {
    let mockController;
    let renderer;
    let plannerListeners = {};

    beforeEach(() => {
        setupUIFixture();
        plannerListeners = {};

        // Mock Planner
        const mockPlanner = {
            graph: { nodes: { size: 0 }, edges: { size: 0 }, clear: () => {}, addEventListener: () => {} },
            robot: { 
                obstacles: [], 
                costRegions: [], 
                getSample: () => {}, 
                getCollisionShape: ()=>({}),
                // Fix: Add getSVGPath stub for Renderer
                getSVGPath: (q1, q2) => `M ${q1.x} ${q1.y} L ${q2.x} ${q2.y}` 
            },
            startConfig: {x:0, y:0}, 
            goalRegions: [],
            initialize: () => {},
            updateParameters: () => {},
            getStatistics: () => ({ nodesVisited: 0 }),
            getSolution: () => null,
            addEventListener: (evt, cb) => { plannerListeners[evt] = cb; }
        };

        mockController = {
            planner: mockPlanner,
            isRunning: false,
            start: () => {}, stop: () => {}, step: () => {}, setSpeed: () => {}, setPlanner: (p) => { mockController.planner = p; }
        };

        // Use Real Renderer to test SVG generation
        const svg = document.getElementById('workspace-svg');
        renderer = new Renderer(svg, mockPlanner.robot, mockPlanner.graph);
        renderer.bindPlannerEvents(mockPlanner);
    });

    afterEach(() => {
        teardownUIFixture();
    });

    it('should draw a dot for a rejected node (config collision)', () => {
        const payload = { type: 'node', config: { x: 5, y: 5 } };
        
        // Trigger event
        if (plannerListeners['SAMPLE_REJECTED']) {
            plannerListeners['SAMPLE_REJECTED'](payload);
        }

        const layer = document.getElementById('layer-rejected');
        const dots = layer.querySelectorAll('circle'); 
        
        expect(dots.length).to.equal(1);
        expect(dots[0].getAttribute('class')).to.contain('svg-rejected-node');
    });

    it('should draw a line for a rejected edge (path collision)', () => {
        const payload = { type: 'edge', from: { x: 0, y: 0 }, to: { x: 10, y: 10 } };
        
        if (plannerListeners['SAMPLE_REJECTED']) {
            plannerListeners['SAMPLE_REJECTED'](payload);
        }

        const layer = document.getElementById('layer-rejected');
        const lines = layer.querySelectorAll('path'); // Changed to path (was line)
        
        expect(lines.length).to.equal(1);
        expect(lines[0].getAttribute('class')).to.contain('svg-rejected-edge');
    });
});
