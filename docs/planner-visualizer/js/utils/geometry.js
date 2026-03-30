/**
 * Geometry Utility Functions
 * Handles basic vector math, coordinate transformations, and distance calculations.
 */

// Constants
export const EPSILON = 1e-6;
export const WORKSPACE_SIZE = 10; // 10m x 10m
export const VIEWBOX_SIZE = 1000; // 1000px x 1000px
const SCALE = VIEWBOX_SIZE / WORKSPACE_SIZE; // 100 pixels per meter

/**
 * Converts a workspace coordinate (meters, origin bottom-left) to SVG coordinate (pixels, origin top-left).
 * @param {number} x - Workspace X
 * @param {number} y - Workspace Y
 * @returns {Object} {x, y} in SVG pixels
 */
export function toSVG(x, y) {
    return {
        x: x * SCALE,
        y: VIEWBOX_SIZE - (y * SCALE)
    };
}

/**
 * Converts an SVG coordinate (pixels, origin top-left) to workspace coordinate (meters, origin bottom-left).
 * @param {number} x - SVG X
 * @param {number} y - SVG Y
 * @returns {Object} {x, y} in Workspace meters
 */
export function fromSVG(x, y) {
    return {
        x: x / SCALE,
        y: (VIEWBOX_SIZE - y) / SCALE
    };
}

/**
 * Calculates Euclidean distance between two points.
 * @param {Object} p1 - {x, y}
 * @param {Object} p2 - {x, y}
 * @returns {number} Distance
 */
export function dist(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates Euclidean squared distance (optimization for comparisons).
 * @param {Object} p1 - {x, y}
 * @param {Object} p2 - {x, y}
 * @returns {number} Squared Distance
 */
export function distSq(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

/**
 * Normalizes an angle to the range (-PI, PI].
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
    let a = angle % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (a <= -Math.PI) a += 2 * Math.PI;
    return a;
}

/**
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Interpolates between two configurations.
 * Handles angle wrapping for theta if present.
 * @param {Object} c1 - Start config {x, y, theta?}
 * @param {Object} c2 - End config {x, y, theta?}
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {Object} Interpolated config
 */
export function interpolateConfig(c1, c2, t) {
    const result = {
        x: lerp(c1.x, c2.x, t),
        y: lerp(c1.y, c2.y, t)
    };

    if (c1.theta !== undefined && c2.theta !== undefined) {
        // Shortest path interpolation for angles
        let diff = c2.theta - c1.theta;
        diff = normalizeAngle(diff);
        result.theta = normalizeAngle(c1.theta + diff * t);
    }

    return result;
}
