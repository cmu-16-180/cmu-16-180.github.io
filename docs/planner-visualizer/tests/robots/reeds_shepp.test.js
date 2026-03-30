import { ReedsSheppRobot } from '../../js/robots/reeds_shepp.js';

const expect = window.chai.expect;

describe('Reeds-Shepp Robot', () => {
    let robot;

    beforeEach(() => {
        robot = new ReedsSheppRobot(1.0);
    });

    it('should penalize reverse motion', () => {
        const start = {x:0, y:0, theta:0};
        const end = {x:-2, y:0, theta:0}; // Straight back 2m

        // Default cost 1.0
        const distNormal = robot.distance(start, end);
        expect(distNormal).to.be.closeTo(2.0, 1e-5);

        // High cost 5.0
        robot.setReverseCost(5.0);
        const distHigh = robot.distance(start, end);
        expect(distHigh).to.be.closeTo(10.0, 1e-5);
    });

    it('should generate valid steering path', () => {
        const start = {x:0, y:0, theta:0};
        const end = {x:0, y:1, theta:0}; // Parallel park
        
        const res = robot.steer(start, end, 10.0);
        expect(res.cost).to.be.greaterThan(1.0);
        expect(res.endConfig.x).to.be.closeTo(0, 1e-5);
    });
});
