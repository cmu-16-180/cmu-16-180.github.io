import { DubinsRobot } from '../../js/robots/dubins.js';
import { toSVG } from '../../js/utils/geometry.js';

const expect = window.chai.expect;

describe('Dubins Robot', () => {
    let robot;

    beforeEach(() => {
        // Radius 1.0, Width 0.5, Length 1.0
        robot = new DubinsRobot(1.0, 0.5, 1.0); 
    });

    describe('Kinematics', () => {
        it('should calculate distance > euclidean for non-aligned configurations', () => {
            const q1 = {x:0, y:0, theta:0};
            // Target is directly above (0, 2). Euclidean is 2.
            // Dubins car facing East (0) cannot drive sideways.
            const q2 = {x:0, y:2, theta:0}; 
            
            const dist = robot.distance(q1, q2);
            expect(dist).to.be.greaterThan(2.0);
        });

        it('should steer along the curve', () => {
            const start = {x:0, y:0, theta:0};
            const goal = {x:0, y:2, theta:0};
            const maxStep = 1.0;
            
            // Should travel partial distance along the Dubins curve
            const result = robot.steer(start, goal, maxStep);
            
            // Cost should be exactly maxStep (limited by it)
            // With cost optimization, this should now be stable.
            expect(result.cost).to.be.closeTo(1.0, 0.001);
            expect(result.endConfig).to.not.deep.equal(start);
            expect(result.endConfig).to.not.deep.equal(goal);
            expect(result.path).to.exist;
        });
    });

    describe('Collision Shape', () => {
        it('should return a polygon (rectangle) oriented correctly', () => {
            const config = {x: 5, y: 5, theta: Math.PI/2}; // Facing North
            const shape = robot.getCollisionShape(config);
            
            expect(shape.type).to.equal('polygon');
            expect(shape.points).to.have.lengthOf(4);
            
            const ys = shape.points.map(p => p.y);
            expect(Math.max(...ys)).to.be.closeTo(5.5, 0.001);
            expect(Math.min(...ys)).to.be.closeTo(4.5, 0.001);
        });
    });

    describe('Visualization', () => {
        it('should generate an SVG path string (polyline approximation)', () => {
            const q1 = {x:0, y:0, theta:0};
            const q2 = {x:0, y:2, theta:Math.PI};
            
            const svgPath = robot.getSVGPath(q1, q2, null);
            expect(svgPath).to.contain('M'); // Move
            // We use polyline approximation (multiple L's), not A
            expect(svgPath).to.contain('L'); 
        });
    });
});
