import { Dubins } from '../../js/utils/dubins.js';

const expect = window.chai.expect;

describe('Dubins Path Math', () => {
    // Standard radius for tests
    const R = 1.0; 
    const dubins = new Dubins(R);

    it('should calculate LSL path length correctly', () => {
        // Start: (0,0,0), End: (10,0,0) -> Straight line 10
        // LSL/RSR should collapse to S if angles align with axis
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: 10, y: 0, theta: 0 };
        
        const path = dubins.getShortestPath(start, end);
        
        // Type should be LSL (0) or RSR (1) or LSD (4?)... 
        // Actually simplest is S. But Dubins set usually returns LSL/RSR for straight.
        expect(path.length).to.be.closeTo(10.0, 1e-5);
    });

    it('should handle simple turning circle', () => {
        // Start: (0,0,0), End: (2, 0, PI). 
        // A circle of radius 1 starting at 0 heading East, doing 180 deg turn?
        // No, (0,0,0) -> (0, 2, PI) is a perfect Left turn of PI rads (length PI*R).
        // Let's try: (0,0,0) -> (sin(pi/2), 1-cos(pi/2), pi/2) = (1, 1, pi/2)
        // This is a 90 deg left turn. Length should be PI/2 * R = 1.57.
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: 1, y: 1, theta: Math.PI/2 };
        
        const path = dubins.getShortestPath(start, end);
        expect(path.length).to.be.closeTo(Math.PI/2, 1e-5);
        expect(path.type).to.equal(0); // 0 = LSL (Left-Straight-Left, where S=0, L2=0) -> just L
    });

    it('should calculate valid path for random configurations', () => {
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: 5, y: 5, theta: Math.PI };
        
        const path = dubins.getShortestPath(start, end);
        
        expect(path).to.not.be.null;
        expect(path.length).to.be.greaterThan(dist(start, end)); // Path must be >= Euclidean
        expect(path.segmentLengths).to.have.lengthOf(3);
    });

    it('should sample points along the path', () => {
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: 10, y: 0, theta: 0 };
        const path = dubins.getShortestPath(start, end);
        
        // Midpoint (t = 5)
        const mid = dubins.sample(start, path, 5.0);
        expect(mid.x).to.be.closeTo(5.0, 1e-5);
        expect(mid.y).to.be.closeTo(0.0, 1e-5);
        expect(mid.theta).to.be.closeTo(0.0, 1e-5);
    });
});

// Helper for euclidian dist in test
function dist(p1, p2) {
    return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
}
