import { UI } from '../../js/view/ui.js';
import { setupUIFixture, teardownUIFixture } from '../fixtures/ui_fixture.js';

const expect = window.chai.expect;

describe('View Options', () => {
    let ui;
    let mockController;
    let mockRenderer;

    beforeEach(() => {
        // Use shared fixture which includes select-robot and all other required elements
        setupUIFixture();

        // Mock dependencies
        mockController = {
            planner: {
                graph: { addEventListener: () => {}, nodes: {size:0}, edges: {size:0}, clear: () => {} },
                robot: { obstacles: [], costRegions: [], getSample: () => {}, getCollisionShape: ()=>({}) },
                initialize: () => {},
                updateParameters: () => {},
                getStatistics: () => ({ nodesVisited: 0, edgesEvaluated: 0 }),
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

        // Initial state: checked, so visible
        expect(layer.style.display).to.not.equal('none');

        // Click to uncheck
        chk.click(); 
        expect(layer.style.display).to.equal('none');

        // Click to check
        chk.click();
        expect(layer.style.display).to.not.equal('none');
    });

    it('should toggle rejected samples visibility when checkbox changes', () => {
        const chk = document.getElementById('chk-show-rejected');
        const layer = document.getElementById('layer-rejected');

        // Initial state: unchecked, hidden (default in fixture depends on HTML, usually unchecked/hidden logic in UI init)
        // In UI.init(): if (chkShowRejected && layers.rejected) layers.rejected.style.display = checked ? '' : 'none';
        // In fixture: <input id="chk-show-rejected" type="checkbox"> (unchecked by default)
        
        // So initial state should be none
        // Note: Checkbox state might vary if UI.init logic forces it.
        // Let's click to toggle and verify change.
        
        const initialDisplay = layer.style.display;
        
        chk.click();
        expect(layer.style.display).to.not.equal(initialDisplay);
        
        chk.click();
        expect(layer.style.display).to.equal(initialDisplay);
    });
});
