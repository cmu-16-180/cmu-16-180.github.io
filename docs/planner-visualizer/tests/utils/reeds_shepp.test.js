import { ReedsShepp } from '../../js/utils/reeds_shepp.js';

const expect = window.chai.expect;

describe('Reeds-Shepp Path Math', () => {
    const R = 1.0; 
    const rs = new ReedsShepp(R);

    it('should calculate straight reverse path', () => {
        // Start: (0,0,0), End: (-5,0,0). 
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: -5, y: 0, theta: 0 };
        
        const path = rs.getShortestPath(start, end);
        
        expect(path.length).to.be.closeTo(5.0, 1e-5);
        
        // Check segments. For a straight line, it might come back as [0, -5, 0] (LSL)
        // We look for the primary segment with length ~ -5.
        const reverseSegment = path.segmentLengths.find(l => l < -4.9);
        expect(reverseSegment).to.exist;
        expect(reverseSegment).to.be.closeTo(-5.0, 1e-5);
    });

    it('should calculate parallel parking maneuver (cusp)', () => {
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: 0, y: 1, theta: 0 };
        
        const path = rs.getShortestPath(start, end);
        
        expect(path).to.not.be.null;
        expect(path.length).to.be.greaterThan(1.0); 
        
        // Verify direction switching (Cusp)
        const signs = path.segmentLengths.map(l => Math.sign(l)).filter(s => s !== 0);
        let hasSwitch = false;
        for(let i=0; i<signs.length-1; i++) {
            if(signs[i] !== signs[i+1]) hasSwitch = true;
        }
        expect(hasSwitch).to.be.true;
    });

    it('should sample points along the path', () => {
        const start = { x: 0, y: 0, theta: 0 };
        const end = { x: -2, y: 0, theta: 0 }; // Straight back
        const path = rs.getShortestPath(start, end);
        
        const mid = rs.sample(start, path, 1.0);
        
        expect(mid.x).to.be.closeTo(-1.0, 1e-5);
        expect(mid.y).to.be.closeTo(0.0, 1e-5);
        expect(mid.theta).to.be.closeTo(0.0, 1e-5);
    });
});
