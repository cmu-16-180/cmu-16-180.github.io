import { createSampler, SAMPLERS } from '../../js/core/sampling.js';
import { WORKSPACE_SIZE } from '../../js/utils/geometry.js';
import { Random } from '../../js/core/random.js'; 

// Explicitly access the global chai object from the window
const expect = window.chai.expect;

describe('Sampling Strategies', () => {
    // Setup a deterministic RNG for testing
    let seededRng;
    beforeEach(() => {
        seededRng = new Random(12345);
    });

    describe('Uniform Sampler', () => {
        it('should return samples within workspace bounds', () => {
            const sampler = createSampler(SAMPLERS.UNIFORM);
            // Default uses Math.random
            for(let i=0; i<100; i++) {
                const s = sampler.getSample(); // Default RNG
                expect(s.x).to.be.within(0, WORKSPACE_SIZE);
                expect(s.y).to.be.within(0, WORKSPACE_SIZE);
            }
        });

        it('should be deterministic with seeded RNG', () => {
            const sampler1 = createSampler(SAMPLERS.UNIFORM);
            const sampler2 = createSampler(SAMPLERS.UNIFORM);
            const rngA = new Random(42);
            const rngB = new Random(42);

            const p1 = sampler1.getSample(rngA);
            const p2 = sampler2.getSample(rngB);

            expect(p1.x).to.equal(p2.x);
            expect(p1.y).to.equal(p2.y);
        });
    });

    describe('Halton Sampler', () => {
        it('should be deterministic regardless of RNG (sequence based)', () => {
            // Halton is inherently deterministic based on index, doesn't use RNG.next()
            const s1 = createSampler(SAMPLERS.HALTON);
            const p1 = s1.getSample();
            const p2 = s1.getSample();

            const s2 = createSampler(SAMPLERS.HALTON);
            const p1_prime = s2.getSample();
            const p2_prime = s2.getSample();

            expect(p1.x).to.equal(p1_prime.x);
            expect(p1.y).to.equal(p1_prime.y);
            expect(p2.x).to.equal(p2_prime.x);
        });
    });

    describe('Grid Sampler', () => {
        it('should use RNG for jitter', () => {
            // FIX: Use separate instances because GridSampler is stateful (increments cell index)
            const s1 = createSampler(SAMPLERS.GRID);
            const s2 = createSampler(SAMPLERS.GRID);
            
            const rngA = new Random(99);
            const rngB = new Random(99);
            
            const p1 = s1.getSample(rngA);
            const p2 = s2.getSample(rngB);

            expect(p1.x).to.equal(p2.x);
            expect(p1.y).to.equal(p2.y);
        });
    });

});
