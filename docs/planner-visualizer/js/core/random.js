/**
 * Random Number Generator
 * Wrapper around Math.random() that supports seeding for deterministic testing.
 */
export class Random {
    /**
     * @param {number|null} seed - Integer seed. If null, uses Math.random().
     */
    constructor(seed = null) {
        this.seed = seed;
    }

    /**
     * Returns a pseudo-random float in range [0, 1).
     * @returns {number}
     */
    next() {
        if (this.seed === null) {
            return Math.random();
        }
        
        // Simple Linear Congruential Generator (LCG)
        // Constants from glibc
        const a = 1103515245;
        const c = 12345;
        const m = 0x80000000; // 2^31

        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }
}
