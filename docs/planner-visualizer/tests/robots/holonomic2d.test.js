import { Holonomic2D } from '../../js/robots/holonomic2d.js';
import { toSVG } from '../../js/utils/geometry.js';

// Explicitly access the global chai object from the window
const expect = window.chai.expect;

describe('Holonomic2D Robot', () => {
    let robot;

    beforeEach(() => {
        robot = new Holonomic2D(0.5); // 0.5m radius
    });

    describe('Kinematics', () => {
        it('should calculate Euclidean distance', () => {
            const q1 = {x:0, y:0};
            const q2 = {x:3, y:4};
            expect(robot.distance(q1, q2)).to.equal(5);
        });

        it('should steer towards goal within maxStep', () => {
            const start = {x:0, y:0};
            const goal = {x:10, y:0};
            const maxStep = 2;
            
            const result = robot.steer(start, goal, maxStep);
            
            expect(result.endConfig.x).to.equal(2);
            expect(result.endConfig.y).to.equal(0);
            expect(result.cost).to.equal(2);
        });

        it('should reach goal if within maxStep', () => {
            const start = {x:0, y:0};
            const goal = {x:1, y:1};
            const maxStep = 5;
            
            const result = robot.steer(start, goal, maxStep);
            
            expect(result.endConfig.x).to.equal(1);
            expect(result.endConfig.y).to.equal(1);
        });
        
        it('should generate valid SVG path data', () => {
            const q1 = {x:0, y:0};
            const q2 = {x:10, y:10};
            
            const svgStart = toSVG(q1.x, q1.y);
            const svgEnd = toSVG(q2.x, q2.y);
            
            const pathD = robot.getSVGPath(q1, q2, null);
            
            // Should be "M x1 y1 L x2 y2"
            expect(pathD).to.contain(`M ${svgStart.x} ${svgStart.y}`);
            expect(pathD).to.contain(`L ${svgEnd.x} ${svgEnd.y}`);
        });
    });

    describe('Collision Detection', () => {
        const obstacle = {
            type: 'circle',
            x: 5,
            y: 5,
            radius: 1
        };

        beforeEach(() => {
            robot.setEnvironment([obstacle], []);
        });

        it('should detect collision when overlapping obstacle', () => {
            // Robot at 5,5 (on top of obstacle)
            const config = {x: 5, y: 5};
            expect(robot.isValidConfig(config)).to.be.false;
        });

        it('should be valid when far away', () => {
            const config = {x: 0, y: 0};
            expect(robot.isValidConfig(config)).to.be.true;
        });

        it('should detect collision at edge of radius', () => {
            // Obstacle radius 1, Robot radius 0.5. Center dist should be > 1.5
            // At x=3.5: dist=1.5. Edge case (touching).
            // At x=3.4: dist=1.6 (valid)
            // At x=3.6: dist=1.4 (collision)
            
            expect(robot.isValidConfig({x: 3.4, y: 5})).to.be.true;
            // Note: collision logic is <= sum radii
            expect(robot.isValidConfig({x: 3.6, y: 5})).to.be.false;
        });

        it('should detect collision along a path (isValidLink)', () => {
            // Start (2, 5) and End (8, 5) are both VALID (outside obstacle).
            // But the path goes straight through the obstacle at (5, 5).
            const start = {x: 2, y: 5};
            const end = {x: 8, y: 5};
            
            // Verify endpoints are valid first
            expect(robot.isValidConfig(start)).to.be.true;
            expect(robot.isValidConfig(end)).to.be.true;

            // Check link
            const valid = robot.isValidLink(start, end, null);
            expect(valid).to.be.false;
        });

        it('should allow valid paths around obstacles', () => {
            // Path from (2, 2) to (8, 2) - safely below the obstacle at (5, 5)
            const start = {x: 2, y: 2};
            const end = {x: 8, y: 2};
            
            const valid = robot.isValidLink(start, end, null);
            expect(valid).to.be.true;
        });
    });

    describe('Cost Calculation', () => {
        it('should return geometric distance if no cost regions', () => {
            robot.setEnvironment([], []);
            const q1 = {x:0, y:0};
            const q2 = {x:10, y:0};
            // Exact calculation might vary due to integration steps, 
            // but for simple flat ground it should be very close.
            const cost = robot.cost(q1, q2, null);
            expect(cost).to.be.closeTo(10, 0.1);
        });

        it('should apply multiplier in cost regions', () => {
            // Region from x=2 to x=4 with 2x cost
            const region = {
                type: 'polygon',
                points: [{x:2, y:-1}, {x:4, y:-1}, {x:4, y:1}, {x:2, y:1}],
                multiplier: 2.0
            };
            robot.setEnvironment([], [region]);

            // Path from 0,0 to 5,0
            // 0->2 (dist 2, cost 2)
            // 2->4 (dist 2, cost 4)
            // 4->5 (dist 1, cost 1)
            // Total expected: 7
            
            const q1 = {x:0, y:0};
            const q2 = {x:5, y:0};
            const cost = robot.cost(q1, q2, null);
            
            // Allow some error due to discrete integration steps
            expect(cost).to.be.closeTo(7, 0.2); 
        });
    });
});
