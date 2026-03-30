import { InteractionManager } from '../../js/view/interaction.js';

const expect = window.chai.expect;

describe('Interaction Manager', () => {
    let interaction;
    let mockController;
    let mockRenderer;
    let mockCallbacks;
    let svgElement;

    beforeEach(() => {
        // Mock SVG element and methods
        svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.getScreenCTM = () => ({ inverse: () => ({ a:1, b:0, c:0, d:1, e:0, f:0 }) });
        svgElement.createSVGPoint = () => ({ x:0, y:0, matrixTransform: (m) => ({x: 10, y: 990}) }); // Mock mouse at (10, 990) -> Model (0.1, 0.1)

        // Mock Controller Data
        mockController = {
            planner: {
                startConfig: { x: 1, y: 1 },
                goalRegions: [{ x: 9, y: 9 }],
                robot: {
                    obstacles: [{ x: 5, y: 5 }],
                    costRegions: []
                },
                reconnect: () => {},
                updateGoals: () => {},
                repairGraph: () => {},
                graph: { clear: () => {} },
                initialize: () => {}
            }
        };

        mockRenderer = {
            updateEnvironment: () => {}
        };

        // Spy on callbacks
        mockCallbacks = {
            onSelect: (obj) => {},
            onDeselect: () => {},
            onDragUpdate: () => {},
            onDragEnd: () => {}
        };

        interaction = new InteractionManager(mockController, mockRenderer, svgElement, mockCallbacks);
    });

    it('should initialize with default tool "select"', () => {
        expect(interaction.activeTool).to.equal('select');
    });

    it('should select robot on click', () => {
        let selected = null;
        interaction.callbacks.onSelect = (obj) => { selected = obj; };

        // Mock event target
        const mockTarget = document.createElement('div');
        mockTarget.classList.add('svg-robot');
        
        interaction.onMouseDown({ target: mockTarget, clientX: 100, clientY: 100, preventDefault: () => {} });

        expect(selected).to.not.be.null;
        expect(selected.type).to.equal('robot');
        expect(selected.ref).to.equal(mockController.planner.startConfig);
    });

    it('should deselect on background click', () => {
        let deselected = false;
        interaction.callbacks.onDeselect = () => { deselected = true; };

        const mockTarget = document.createElement('div');
        mockTarget.id = 'bg-grid';

        interaction.onMouseDown({ target: mockTarget, clientX: 0, clientY: 0, preventDefault: () => {} });

        expect(deselected).to.be.true;
    });

    it('should set drag state on selection', () => {
        const mockTarget = document.createElement('div');
        mockTarget.classList.add('svg-robot');

        interaction.onMouseDown({ target: mockTarget, clientX: 0, clientY: 0, preventDefault: () => {} });

        expect(interaction.dragState).to.not.be.null;
        expect(interaction.dragState.active).to.be.true;
    });
});
