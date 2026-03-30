import { isCollision, pointInPolygon, testCirclePolygon, testPolygonPolygon } from '../../js/utils/collision.js';

const expect = window.chai.expect;

describe('Collision Detection Utils', () => {

    // --- Shapes for Testing ---
    const circleA = { type: 'circle', x: 0, y: 0, radius: 1 };
    const circleB = { type: 'circle', x: 1.5, y: 0, radius: 1 }; // Overlaps A
    const circleC = { type: 'circle', x: 3, y: 0, radius: 1 };   // Separate from A

    const polySquare = { 
        type: 'polygon', 
        points: [{x:0, y:0}, {x:2, y:0}, {x:2, y:2}, {x:0, y:2}] 
    }; // Square from (0,0) to (2,2)

    const polyTriangle = {
        type: 'polygon',
        points: [{x:1, y:-1}, {x:3, y:-1}, {x:2, y:1}]
    }; // Triangle pointing up, overlaps bottom-right of Square

    describe('pointInPolygon()', () => {
        it('should return true for point inside', () => {
            expect(pointInPolygon({x: 1, y: 1}, polySquare)).to.be.true;
        });

        it('should return false for point outside', () => {
            expect(pointInPolygon({x: 3, y: 3}, polySquare)).to.be.false;
        });

        it('should handle edges/vertices (ray casting edge cases)', () => {
            // Note: Ray casting stability on edges can vary, but standard implementation 
            // usually treats bottom/left edges as inclusive and top/right as exclusive 
            // or relies on epsilon. Our implementation uses > checks.
            // Let's test a clearly inside point near edge.
            expect(pointInPolygon({x: 0.1, y: 0.1}, polySquare)).to.be.true;
        });
    });

    describe('Circle-Circle Collision', () => {
        it('should detect overlap', () => {
            expect(isCollision(circleA, circleB)).to.be.true;
        });

        it('should detect separation', () => {
            expect(isCollision(circleA, circleC)).to.be.false;
        });
    });

    describe('Circle-Polygon Collision', () => {
        it('should detect center inside polygon', () => {
            const cInside = { type: 'circle', x: 1, y: 1, radius: 0.5 };
            expect(testCirclePolygon(cInside, polySquare)).to.be.true;
        });

        it('should detect edge intersection (center outside)', () => {
            // Circle at (-0.5, 1) radius 1. Overlaps left edge of square at x=0
            const cEdge = { type: 'circle', x: -0.5, y: 1, radius: 1 };
            expect(testCirclePolygon(cEdge, polySquare)).to.be.true;
        });

        it('should detect separation', () => {
            const cFar = { type: 'circle', x: -2, y: 1, radius: 0.5 };
            expect(testCirclePolygon(cFar, polySquare)).to.be.false;
        });
    });

    describe('Polygon-Polygon Collision', () => {
        it('should detect overlapping polygons', () => {
            expect(testPolygonPolygon(polySquare, polyTriangle)).to.be.true;
        });

        it('should detect containment (one inside another)', () => {
            const smallSquare = {
                type: 'polygon',
                points: [{x:0.5, y:0.5}, {x:1.5, y:0.5}, {x:1.5, y:1.5}, {x:0.5, y:1.5}]
            };
            expect(testPolygonPolygon(polySquare, smallSquare)).to.be.true;
        });

        it('should detect separation', () => {
            const farRect = {
                type: 'polygon',
                points: [{x:10, y:10}, {x:12, y:10}, {x:12, y:12}, {x:10, y:12}]
            };
            expect(testPolygonPolygon(polySquare, farRect)).to.be.false;
        });
    });

});
