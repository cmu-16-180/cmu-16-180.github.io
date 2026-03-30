/**
 * Dubins Curves Implementation
 * Solves for the shortest path between two oriented points (x, y, theta) 
 * given a minimum turning radius.
 * * Based on: 
 * Dubins, L. E. (1957). "On curves of minimal length with a constraint on average curvature".
 * Shkel, A. M., & Lumelsky, V. (2001). "Classification of the Dubins set".
 */

import { normalizeAngle } from './geometry.js';

const TYPES = {
    LSL: 0,
    LSR: 1,
    RSL: 2,
    RSR: 3,
    RLR: 4,
    LRL: 5
};

// Word definitions corresponding to types [seg1, seg2, seg3]
// s: straight, l: left, r: right
const WORDS = [
    ['L', 'S', 'L'], // 0
    ['L', 'S', 'R'], // 1
    ['R', 'S', 'L'], // 2
    ['R', 'S', 'R'], // 3
    ['R', 'L', 'R'], // 4
    ['L', 'R', 'L']  // 5
];

export class Dubins {
    constructor(radius = 1.0) {
        this.radius = radius;
    }

    /**
     * Finds the shortest Dubins path.
     * @param {Object} q1 - Start {x, y, theta}
     * @param {Object} q2 - End {x, y, theta}
     * @returns {Object} { length, type, segmentLengths: [t, p, q] }
     */
    getShortestPath(q1, q2) {
        // Normalize coordinates by radius (standard Dubins assumes R=1)
        const dx = q2.x - q1.x;
        const dy = q2.y - q1.y;
        const D = Math.sqrt(dx*dx + dy*dy);
        const d = D / this.radius;

        // Angle of the line connecting q1 to q2
        const theta = normalizeAngle(Math.atan2(dy, dx));

        // Alpha: Start angle relative to connecting line
        const alpha = normalizeAngle(q1.theta - theta);
        // Beta: End angle relative to connecting line
        const beta = normalizeAngle(q2.theta - theta);

        let bestPath = { length: Infinity, type: -1, segmentLengths: [] };

        // Helper to update best path
        const check = (res, typeId) => {
            if (res && res.length < bestPath.length) {
                bestPath = {
                    length: res.length * this.radius, // Scale back to real units
                    type: typeId,
                    segmentLengths: [res.t * this.radius, res.p * this.radius, res.q * this.radius]
                };
            }
        };

        check(this.LSL(alpha, beta, d), TYPES.LSL);
        check(this.RSR(alpha, beta, d), TYPES.RSR);
        check(this.LSR(alpha, beta, d), TYPES.LSR);
        check(this.RSL(alpha, beta, d), TYPES.RSL);
        check(this.RLR(alpha, beta, d), TYPES.RLR);
        check(this.LRL(alpha, beta, d), TYPES.LRL);

        return bestPath;
    }

    /**
     * Samples a configuration along the path at distance `dist` from start.
     * @param {Object} start - Start config
     * @param {Object} pathData - Return value from getShortestPath
     * @param {number} dist - Distance along path
     */
    sample(start, pathData, dist) {
        if (dist <= 0) return { ...start };
        if (dist >= pathData.length) {
            // Need end config calculation logic or we rely on caller to know end?
            // Actually steer() usually provides endConfig separately, but to sample intermediate we compute.
            // Let's compute exact if overshot.
        }

        const segs = pathData.segmentLengths;
        const types = WORDS[pathData.type]; // e.g. ['L', 'S', 'L']

        let currentConfig = { ...start };
        let remainingDist = dist;

        for (let i = 0; i < 3; i++) {
            const segLen = segs[i];
            const moveDist = Math.min(remainingDist, segLen);
            const type = types[i];

            currentConfig = this.integrate(currentConfig, moveDist, type);
            remainingDist -= moveDist;

            if (remainingDist <= 1e-6) break;
        }

        return currentConfig;
    }

    // --- Primitive Integrator ---
    integrate(config, dist, type) {
        const { x, y, theta } = config;
        let newX, newY, newTheta;

        if (type === 'S') {
            newX = x + Math.cos(theta) * dist;
            newY = y + Math.sin(theta) * dist;
            newTheta = theta;
        } else {
            // Turning
            // L: turn +1 (CCW), R: turn -1 (CW)
            // Normalized distance `dist` on a circle of `radius`
            // Arc angle `phi` = dist / radius
            const phi = dist / this.radius * (type === 'L' ? 1 : -1);
            
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const sinThetaPhi = Math.sin(theta + phi);
            const cosThetaPhi = Math.cos(theta + phi);

            // Center of curvature offset vector is perpendicular to heading
            // L: center is at theta + pi/2. R: theta - pi/2.
            // Delta X/Y logic standard derivation:
            newX = x + this.radius * (Math.sin(theta + phi) - Math.sin(theta)) * (type === 'L' ? 1 : -1); // Wait, logic check
            // Standard formula:
            // x(t) = x0 + R * (sin(theta0 + phi) - sin(theta0)) [For Left?]
            // Let's use simpler relative motion:
            // dX_local = R * sin(phi)
            // dY_local = R * (1 - cos(phi))  (if L, center is left)
            
            // Standard Dubins formula:
            // x_new = x + R * ( sin(theta + phi) - sin(theta) )  [if Left]
            // y_new = y + R * ( cos(theta) - cos(theta + phi) )  [if Left]
            
            // If Right: R -> -R?
            // phi is negative for Right.
            // x_new = x - R * ( sin(theta + phi) - sin(theta) ) ? No.
            
            // Let's use robust method:
            const dir = type === 'L' ? 1 : -1;
            newX = x + this.radius * dir * (Math.sin(theta + phi) - Math.sin(theta));
            newY = y + this.radius * dir * (Math.cos(theta) - Math.cos(theta + phi));
            newTheta = normalizeAngle(theta + phi);
        }

        return { x: newX, y: newY, theta: newTheta };
    }

    // --- Math Helpers (Shkel & Lumelsky constants) ---
    // Returns {t, p, q} normalized lengths or null if invalid
    
    _mod2pi(theta) {
        return theta - 2 * Math.PI * Math.floor(theta / (2 * Math.PI));
    }

    LSL(alpha, beta, d) {
        const tmp0 = d + Math.sin(alpha) - Math.sin(beta);
        const p_squared = 2 + (d * d) - (2 * Math.cos(alpha - beta)) + (2 * d * (Math.sin(alpha) - Math.sin(beta)));
        if (p_squared < 0) return null;
        
        const tmp1 = Math.atan2((Math.cos(beta) - Math.cos(alpha)), tmp0);
        const t = this._mod2pi(-alpha + tmp1);
        const p = Math.sqrt(p_squared);
        const q = this._mod2pi(beta - tmp1);
        return { t, p, q, length: t + p + q };
    }

    RSR(alpha, beta, d) {
        const tmp0 = d - Math.sin(alpha) + Math.sin(beta);
        const p_squared = 2 + (d * d) - (2 * Math.cos(alpha - beta)) + (2 * d * (Math.sin(beta) - Math.sin(alpha)));
        if (p_squared < 0) return null;

        const tmp1 = Math.atan2((Math.cos(alpha) - Math.cos(beta)), tmp0);
        const t = this._mod2pi(alpha - tmp1);
        const p = Math.sqrt(p_squared);
        const q = this._mod2pi(-beta + tmp1);
        return { t, p, q, length: t + p + q };
    }

    LSR(alpha, beta, d) {
        const p_squared = -2 + (d * d) + (2 * Math.cos(alpha - beta)) + (2 * d * (Math.sin(alpha) + Math.sin(beta)));
        if (p_squared < 0) return null;

        const p = Math.sqrt(p_squared);
        const tmp2 = Math.atan2((-Math.cos(alpha) - Math.cos(beta)), (d + Math.sin(alpha) + Math.sin(beta))) - Math.atan2(-2.0, p);
        const t = this._mod2pi(-alpha + tmp2);
        const q = this._mod2pi(-this._mod2pi(beta) + tmp2);
        return { t, p, q, length: t + p + q };
    }

    RSL(alpha, beta, d) {
        const p_squared = (d * d) - 2 + (2 * Math.cos(alpha - beta)) - (2 * d * (Math.sin(alpha) + Math.sin(beta)));
        if (p_squared < 0) return null;

        const p = Math.sqrt(p_squared);
        const tmp2 = Math.atan2((Math.cos(alpha) + Math.cos(beta)), (d - Math.sin(alpha) - Math.sin(beta))) - Math.atan2(2.0, p);
        const t = this._mod2pi(alpha - tmp2);
        const q = this._mod2pi(beta - tmp2);
        return { t, p, q, length: t + p + q };
    }

    RLR(alpha, beta, d) {
        const tmp_rlr = (6.0 - d * d + 2.0 * Math.cos(alpha - beta) + 2.0 * d * (Math.sin(alpha) - Math.sin(beta))) / 8.0;
        if (Math.abs(tmp_rlr) > 1.0) return null;

        const p = this._mod2pi(2 * Math.PI - Math.acos(tmp_rlr));
        const t = this._mod2pi(alpha - Math.atan2((Math.cos(alpha) - Math.cos(beta)), d - Math.sin(alpha) + Math.sin(beta)) + p / 2.0);
        const q = this._mod2pi(alpha - beta - t + p);
        return { t, p, q, length: t + p + q };
    }

    LRL(alpha, beta, d) {
        const tmp_lrl = (6.0 - d * d + 2.0 * Math.cos(alpha - beta) + 2.0 * d * (-Math.sin(alpha) + Math.sin(beta))) / 8.0;
        if (Math.abs(tmp_lrl) > 1.0) return null;

        const p = this._mod2pi(2 * Math.PI - Math.acos(tmp_lrl));
        const t = this._mod2pi(-alpha - Math.atan2((Math.cos(alpha) - Math.cos(beta)), d + Math.sin(alpha) - Math.sin(beta)) + p / 2.0);
        const q = this._mod2pi(this._mod2pi(beta) - alpha - t + p);
        return { t, p, q, length: t + p + q };
    }
}
