import { Random } from '../../js/core/random.js';

const expect = window.chai.expect;

describe('Random Number Generator', () => {
    it('should be deterministic with a seed', () => {
        const rng1 = new Random(12345);
        const rng2 = new Random(12345);
        
        const val1_1 = rng1.next();
        const val1_2 = rng1.next();
        const val1_3 = rng1.next();

        const val2_1 = rng2.next();
        const val2_2 = rng2.next();
        const val2_3 = rng2.next();

        expect(val1_1).to.equal(val2_1);
        expect(val1_2).to.equal(val2_2);
        expect(val1_3).to.equal(val2_3);
    });

    it('should diverge with different seeds', () => {
        const rng1 = new Random(12345);
        const rng2 = new Random(67890);
        
        expect(rng1.next()).to.not.equal(rng2.next());
    });

    it('should return values within [0, 1)', () => {
        const rng = new Random(123);
        for(let i=0; i<100; i++) {
            const val = rng.next();
            expect(val).to.be.at.least(0);
            expect(val).to.be.below(1);
        }
    });
});
