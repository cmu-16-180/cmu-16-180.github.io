import { UI } from '../../js/view/ui.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('View Options', () => {
    let ui;
    let mockController;
    let mockRenderer;

    beforeEach(() => {
        setupUIFixture();

        // Mock dependencies
        mockController = {
            planner: {
                graph: { addEventListener: () => {}, nodes: {size:0}, edges: {size:0}, clear: () => {} },
                robot: { obstacles: [], costRegions: [], getSample: () => {} },
                initialize: () => {},
                updateParameters: () => {},
                getStatistics: () => ({}),
                getSolution: () => null,
                addEventListener: () => {}
            },
            isRunning: false,
            setSpeed: () => {},
            stop: () => {},
            setPlanner: () => {}
        };

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

    it('should toggle grid visibility when checkbox changes', () => {
        const chk = document.getElementById('chk-show-grid');
        const layer = document.getElementById('bg-grid');

        // Check fixture defaults
        expect(layer.style.display).to.not.equal('none');

        chk.click(); 
        expect(layer.style.display).to.equal('none');

        chk.click();
        expect(layer.style.display).to.not.equal('none');
    });

    it('should toggle rejected samples visibility when checkbox changes', () => {
        const chk = document.getElementById('chk-show-rejected');
        const layer = document.getElementById('layer-rejected');

        // UI init sets it based on checkbox state. Checkbox unchecked by default in fixture? 
        // No, in index.html it is unchecked. In MOCK_DOM it is <input ...>.
        // Let's verify start state.
        
        // Actually, UI.init syncs state.
        chk.click(); 
        // If it started hidden, it should now be visible? 
        // Or if start visible, now hidden.
        
        // Simpler check: Just ensure clicking toggles it from whatever it was.
        const startState = layer.style.display;
        chk.click();
        expect(layer.style.display).to.not.equal(startState);
    });
});
