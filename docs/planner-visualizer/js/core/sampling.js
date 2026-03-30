/**
 * Sampling Strategies
 * Implements different methods for generating random configuration samples.
 */

import { WORKSPACE_SIZE } from '../utils/geometry.js';

export const SAMPLERS = {
    UNIFORM: 'UNIFORM',
    HALTON: 'HALTON',
    GRID: 'GRID'
};

// Default global RNG wrapper if none provided
const defaultRng = {
    next: () => Math.random()
};

/**
 * Base Sampler Class
 */
class Sampler {
    constructor() {
        this.reset();
    }

    reset() {
        // Reset internal state if needed
    }

    /**
     * Generates a sample in the workspace [0, WORKSPACE_SIZE].
     * @param {Object} rng - Random Number Generator instance { next: ()=>number }
     * @returns {Object} {x, y}
     */
    getSample(rng = defaultRng) {
        throw new Error("Method 'getSample()' must be implemented.");
    }
}

/**
 * Uniform Random Sampler
 */
export class UniformSampler extends Sampler {
    getSample(rng = defaultRng) {
        return {
            x: rng.next() * WORKSPACE_SIZE,
            y: rng.next() * WORKSPACE_SIZE
        };
    }
}

/**
 * Halton Sequence Sampler
 * Deterministic low-discrepancy sequence.
 * Ignores RNG for the base sequence (it is its own PRNG).
 */
export class HaltonSampler extends Sampler {
    constructor() {
        super();
        this.index = 0;
        this.baseX = 2;
        this.baseY = 3;
    }

    reset() {
        this.index = 0;
    }

    _halton(index, base) {
        let result = 0;
        let f = 1 / base;
        let i = index;
        while (i > 0) {
            result = result + f * (i % base);
            i = Math.floor(i / base);
            f = f / base;
        }
        return result;
    }

    getSample(rng = defaultRng) {
        this.index++;
        return {
            x: this._halton(this.index, this.baseX) * WORKSPACE_SIZE,
            y: this._halton(this.index, this.baseY) * WORKSPACE_SIZE
        };
    }
}

/**
 * Jittered Grid Sampler
 * Samples from a grid with added random noise.
 */
export class GridSampler extends Sampler {
    constructor(cellsPerSide = 20) {
        super();
        this.cellsPerSide = cellsPerSide;
        this.cellSize = WORKSPACE_SIZE / this.cellsPerSide;
        this.totalCells = this.cellsPerSide * this.cellsPerSide;
        this.currentCell = 0;
    }

    reset() {
        this.currentCell = 0;
    }

    getSample(rng = defaultRng) {
        if (this.currentCell >= this.totalCells) {
            // Fallback to uniform if grid exhausted
            return {
                x: rng.next() * WORKSPACE_SIZE,
                y: rng.next() * WORKSPACE_SIZE
            };
        }

        const row = Math.floor(this.currentCell / this.cellsPerSide);
        const col = this.currentCell % this.cellsPerSide;
        this.currentCell++;

        const baseX = col * this.cellSize;
        const baseY = row * this.cellSize;

        // Jitter within the cell using provided RNG
        return {
            x: baseX + rng.next() * this.cellSize,
            y: baseY + rng.next() * this.cellSize
        };
    }
}

// Factory
export function createSampler(type) {
    switch (type) {
        case SAMPLERS.HALTON: return new HaltonSampler();
        case SAMPLERS.GRID: return new GridSampler();
        case SAMPLERS.UNIFORM:
        default: return new UniformSampler();
    }
}
