import { dist, normalizeAngle, toSVG, fromSVG, interpolateConfig } from '../../js/utils/geometry.js';

// Explicitly access the global chai object from the window
const expect = window.chai.expect;

describe('Geometry Utils', () => {
    
    describe('dist()', () => {
        it('should calculate Euclidean distance correctly', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 3, y: 4 };
            expect(dist(p1, p2)).to.equal(5);
        });
    });

    describe('normalizeAngle()', () => {
        it('should keep angles within [-PI, PI]', () => {
            expect(normalizeAngle(0)).to.equal(0);
            expect(normalizeAngle(Math.PI)).to.equal(Math.PI);
            expect(normalizeAngle(-Math.PI)).to.equal(Math.PI); // Edge case usually maps to PI, but -PI is effectively same
        });

        it('should wrap large positive angles', () => {
            // 3 PI -> PI
            expect(normalizeAngle(3 * Math.PI)).to.be.closeTo(Math.PI, 0.001);
        });

        it('should wrap large negative angles', () => {
            // -3 PI -> -PI
            expect(normalizeAngle(-3 * Math.PI)).to.be.closeTo(Math.PI, 0.001);
        });
    });

    describe('Coordinate Transforms', () => {
        it('should correctly transform workspace to SVG', () => {
            // Bottom-Left (0,0) -> Bottom-Left SVG (0, 1000)
            const svg = toSVG(0, 0);
            expect(svg.x).to.equal(0);
            expect(svg.y).to.equal(1000);

            // Top-Right (10, 10) -> Top-Right SVG (1000, 0)
            const svg2 = toSVG(10, 10);
            expect(svg2.x).to.equal(1000);
            expect(svg2.y).to.equal(0);
        });

        it('should be reversible', () => {
            const x = 5, y = 5;
            const svg = toSVG(x, y);
            const ws = fromSVG(svg.x, svg.y);
            expect(ws.x).to.equal(x);
            expect(ws.y).to.equal(y);
        });
    });

    describe('interpolateConfig()', () => {
        it('should interpolate X and Y linear', () => {
            const c1 = { x: 0, y: 0 };
            const c2 = { x: 10, y: 10 };
            const res = interpolateConfig(c1, c2, 0.5);
            expect(res.x).to.equal(5);
            expect(res.y).to.equal(5);
        });

        it('should interpolate Theta correctly (shortest path)', () => {
            // 350 deg (-10 deg) to 10 deg -> should pass through 0
            const c1 = { x:0, y:0, theta: -0.1 };
            const c2 = { x:0, y:0, theta: 0.1 };
            const res = interpolateConfig(c1, c2, 0.5);
            expect(res.theta).to.be.closeTo(0, 0.001);
        });
    });

});
