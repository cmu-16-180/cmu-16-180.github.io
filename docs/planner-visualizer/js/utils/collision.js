/**
 * Collision Detection Utilities
 * Handles collision checks between primitive shapes (Circles, Polygons).
 * Supports non-convex polygons via edge intersection and ray casting.
 */

import { distSq, dist } from './geometry.js';

// --- Types ---
// Circle: { type: 'circle', x, y, radius }
// Polygon: { type: 'polygon', points: [{x,y}, ...] } 
// Note: Polygon points should be in order (CW or CCW).

/**
 * Checks if a point is inside a polygon using Ray Casting (Even-Odd rule).
 * @param {Object} point - {x, y}
 * @param {Object} polygon - { points: [{x,y}, ...] }
 * @returns {boolean}
 */
export function pointInPolygon(point, polygon) {
    let inside = false;
    const vs = polygon.points;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].x, yi = vs[i].y;
        const xj = vs[j].x, yj = vs[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Calculates the squared distance from a point to a line segment.
 * @param {Object} p - Point {x, y}
 * @param {Object} v - Segment Start {x, y}
 * @param {Object} w - Segment End {x, y}
 * @returns {number} Squared distance
 */
function distToSegmentSq(p, v, w) {
    const l2 = distSq(v, w);
    if (l2 === 0) return distSq(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    };
    return distSq(p, projection);
}

/**
 * Checks collision between two Circles.
 */
export function testCircleCircle(c1, c2) {
    const d2 = distSq({x: c1.x, y: c1.y}, {x: c2.x, y: c2.y});
    const rSum = c1.radius + c2.radius;
    return d2 <= rSum * rSum;
}

/**
 * Checks collision between a Circle and a Polygon.
 */
export function testCirclePolygon(circle, polygon) {
    // 1. Check if circle center is inside polygon
    if (pointInPolygon({x: circle.x, y: circle.y}, polygon)) return true;

    // 2. Check if any polygon edge intersects the circle
    // (i.e. distance from center to edge <= radius)
    const r2 = circle.radius * circle.radius;
    const vs = polygon.points;
    for (let i = 0; i < vs.length; i++) {
        const next = (i + 1) % vs.length;
        if (distToSegmentSq({x: circle.x, y: circle.y}, vs[i], vs[next]) <= r2) {
            return true;
        }
    }
    return false;
}

/**
 * Helper: Checks if two line segments intersect.
 */
function getLineIntersection(p1, p2, p3, p4) {
    const s1_x = p2.x - p1.x;
    const s1_y = p2.y - p1.y;
    const s2_x = p4.x - p3.x;
    const s2_y = p4.y - p3.y;

    const s = (-s1_y * (p1.x - p3.x) + s1_x * (p1.y - p3.y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = ( s2_x * (p1.y - p3.y) - s2_y * (p1.x - p3.x)) / (-s2_x * s1_y + s1_x * s2_y);

    return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

/**
 * Checks collision between two Polygons.
 */
export function testPolygonPolygon(poly1, poly2) {
    // 1. Check if any edges intersect
    const vs1 = poly1.points;
    const vs2 = poly2.points;

    for (let i = 0; i < vs1.length; i++) {
        const p1 = vs1[i];
        const p2 = vs1[(i + 1) % vs1.length];
        
        for (let j = 0; j < vs2.length; j++) {
            const p3 = vs2[j];
            const p4 = vs2[(j + 1) % vs2.length];
            
            if (getLineIntersection(p1, p2, p3, p4)) return true;
        }
    }

    // 2. Check containment (Poly1 inside Poly2 or vice versa)
    // If no edges intersect, one might be completely inside the other.
    if (pointInPolygon(vs1[0], poly2)) return true;
    if (pointInPolygon(vs2[0], poly1)) return true;

    return false;
}

/**
 * Universal Collision Check.
 * Dispatches to specific tests based on shape type.
 * @param {Object} shapeA 
 * @param {Object} shapeB 
 * @returns {boolean}
 */
export function isCollision(shapeA, shapeB) {
    if (shapeA.type === 'circle' && shapeB.type === 'circle') {
        return testCircleCircle(shapeA, shapeB);
    }
    if (shapeA.type === 'circle' && shapeB.type === 'polygon') {
        return testCirclePolygon(shapeA, shapeB);
    }
    if (shapeA.type === 'polygon' && shapeB.type === 'circle') {
        return testCirclePolygon(shapeB, shapeA);
    }
    if (shapeA.type === 'polygon' && shapeB.type === 'polygon') {
        return testPolygonPolygon(shapeA, shapeB);
    }
    return false;
}
