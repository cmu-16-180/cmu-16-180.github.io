import { Renderer } from '../../js/view/renderer.js';
import { Graph } from '../../js/core/graph.js';
import { toSVG } from '../../js/utils/geometry.js';

const expect = window.chai.expect;

describe('Renderer', () => {
    let renderer;
    let mockRobot;
    let graph;
    let svgContainer;

    beforeEach(() => {
        // 1. Mock DOM
        // We create a temporary SVG in the body to ensure standard DOM methods work
        svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgContainer.id = 'workspace-svg';
        document.body.appendChild(svgContainer);
        
        // Add required layer groups
        ['bg-grid', 'layer-cost-regions', 'layer-ellipse', 'layer-goals', 'layer-graph', 
         'layer-graph-nodes', 'layer-obstacles', 'layer-rejected', 'layer-solution', 'layer-robot'
        ].forEach(id => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.id = id;
            svgContainer.appendChild(g);
        });

        // 2. Mock Robot
        mockRobot = {
            getSVGPath: (q1, q2) => {
                const s = toSVG(q1.x, q1.y);
                const e = toSVG(q2.x, q2.y);
                return `M ${s.x} ${s.y} L ${e.x} ${e.y}`; 
            },
            costRegions: [],
            obstacles: [],
            getCollisionShape: () => ({type: 'circle', x:0, y:0, radius:1})
        };

        // 3. Real Graph
        graph = new Graph();

        renderer = new Renderer(svgContainer, mockRobot, graph);
    });

    afterEach(() => {
        document.body.removeChild(svgContainer);
    });

    it('should delegate path generation to robot when adding edges', () => {
        const n1 = graph.addNode({x:0, y:0});
        const n2 = graph.addNode({x:1, y:1});
        
        // Spy on getSVGPath
        let called = false;
        const originalGetSVGPath = mockRobot.getSVGPath;
        mockRobot.getSVGPath = (q1, q2) => {
            called = true;
            return originalGetSVGPath(q1, q2);
        };

        // Trigger edge addition
        const edge = graph.addEdge(n1.id, n2.id, 1);

        expect(called).to.be.true;

        // Check DOM
        const layer = document.getElementById('layer-graph');
        const pathEl = layer.querySelector('path');
        expect(pathEl).to.exist;
        // Verify it used the path string, not x1/y1 attributes
        expect(pathEl.getAttribute('d')).to.include('M 0 1000'); // (0,0) mapped
    });

    it('should use robot.getSVGPath for solution drawing', () => {
        const solution = {
            path: [
                { id: 0, config: {x:0, y:0} },
                { id: 1, config: {x:1, y:1} }
            ],
            cost: 1,
            segments: 1
        };

        let called = false;
        mockRobot.getSVGPath = (q1, q2) => {
            called = true;
            return "M 0 0 L 10 10"; // dummy return
        };

        renderer.drawSolution(solution);
        
        expect(called).to.be.true;
    });
});
