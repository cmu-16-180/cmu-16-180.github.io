import { Graph } from '../../js/core/graph.js';

const expect = window.chai.expect;

describe('Graph Data Structure', () => {
    let graph;
    
    // Mock Robot for distance calc
    const mockRobot = {
        distance: (c1, c2) => {
            return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
        }
    };

    beforeEach(() => {
        graph = new Graph();
    });

    it('should add nodes and assign IDs', () => {
        const n1 = graph.addNode({x:0, y:0});
        const n2 = graph.addNode({x:1, y:1});
        expect(n1.id).to.equal(0);
        expect(n2.id).to.equal(1);
        expect(graph.nodes.size).to.equal(2);
    });

    it('should emit events when nodes are added', (done) => {
        graph.addEventListener('NODE_ADDED', (payload) => {
            expect(payload.node.config.x).to.equal(10);
            done();
        });
        graph.addNode({x:10, y:10});
    });

    it('should add edges and update adjacency', () => {
        const n1 = graph.addNode({x:0, y:0});
        const n2 = graph.addNode({x:1, y:1});
        const edge = graph.addEdge(n1.id, n2.id, 1.414);

        expect(edge.sourceId).to.equal(n1.id);
        expect(edge.targetId).to.equal(n2.id);
        
        expect(n1.outgoingEdges.has(edge.id)).to.be.true;
        expect(n2.incomingEdges.has(edge.id)).to.be.true;
    });

    it('should find nearest node', () => {
        graph.addNode({x:0, y:0}); // id 0
        graph.addNode({x:10, y:10}); // id 1
        
        const target = {x: 9, y: 9};
        const result = graph.getNearestNode(target, mockRobot);
        
        expect(result.node.id).to.equal(1);
        expect(result.dist).to.be.closeTo(1.414, 0.001);
    });

    it('should reconstruct path to root', () => {
        // Root -> A -> B
        const root = graph.addNode({x:0, y:0});
        
        const a = graph.addNode({x:1, y:1});
        a.parentId = root.id;
        
        const b = graph.addNode({x:2, y:2});
        b.parentId = a.id;

        const path = graph.getPathToRoot(b.id);
        
        expect(path.length).to.equal(3);
        expect(path[0].id).to.equal(root.id);
        expect(path[1].id).to.equal(a.id);
        expect(path[2].id).to.equal(b.id);
    });

    it('should clear correctly', () => {
        graph.addNode({x:0, y:0});
        graph.clear();
        expect(graph.nodes.size).to.equal(0);
        expect(graph.nodeIdCounter).to.equal(0);
    });

});
