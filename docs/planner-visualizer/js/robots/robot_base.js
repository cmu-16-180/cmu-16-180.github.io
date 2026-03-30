/**
 * Abstract Robot Base Class
 * Defines the interface for kinematics and cost calculations.
 */

import { interpolateConfig, dist, distSq } from '../utils/geometry.js';
import { isCollision, pointInPolygon } from '../utils/collision.js';

export class RobotBase {
    constructor() {
        this.obstacles = [];
        this.costRegions = [];
        this.integrationStepSize = 0.1; 
    }

    setEnvironment(obstacles, costRegions) {
        this.obstacles = obstacles;
        this.costRegions = costRegions;
    }

    // --- Kinematics Interface ---
    getSample(strategy, index, rng) { throw new Error("Not Implemented"); }
    distance(q1, q2) { throw new Error("Not Implemented"); }
    steer(start, goal, maxStep) { throw new Error("Not Implemented"); }

    /**
     * Generates the SVG Path Data string ('d' attribute) for a segment.
     * @param {Object} q1 - Start config
     * @param {Object} q2 - End config
     * @param {Object} pathData - Path specific data from steer()
     * @returns {string} SVG 'd' string (e.g. "M x y L x y")
     */
    getSVGPath(q1, q2, pathData) { throw new Error("Not Implemented"); }

    // --- Collision & Cost ---
    getCollisionShape(config) { throw new Error("Not Implemented"); }

    isValidConfig(config) {
        const robotShape = this.getCollisionShape(config);
        
        if (config.x < 0 || config.x > 10 || config.y < 0 || config.y > 10) {
            return false; 
        }

        for (const obs of this.obstacles) {
            if (isCollision(robotShape, obs)) {
                return false;
            }
        }
        return true;
    }

    isValidLink(startConfig, endConfig, pathData) {
        const d = this.distance(startConfig, endConfig);
        const steps = Math.ceil(d / this.integrationStepSize);
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const intermediate = this.interpolate(startConfig, endConfig, t, pathData);
            if (!this.isValidConfig(intermediate)) {
                return false;
            }
        }
        return true;
    }

    cost(q1, q2, pathData) {
        const d = this.distance(q1, q2);
        const steps = Math.ceil(d / this.integrationStepSize);
        
        let totalCost = 0;
        let lastConfig = q1;

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const currentConfig = this.interpolate(q1, q2, t, pathData);
            const stepDist = this.distance(lastConfig, currentConfig);
            const multiplier = this.getCostMultiplierAt(currentConfig);
            
            totalCost += stepDist * multiplier;
            lastConfig = currentConfig;
        }
        return totalCost;
    }

    getCostMultiplierAt(config) {
        let multiplier = 1.0;
        const point = { x: config.x, y: config.y };

        for (const region of this.costRegions) {
            let inside = false;
            if (region.type === 'circle') {
                inside = distSq(point, {x: region.x, y: region.y}) <= region.radius * region.radius;
            } else if (region.type === 'polygon') {
                inside = pointInPolygon(point, region);
            } else if (region.type === 'rectangle') {
                if (region.points) {
                    inside = pointInPolygon(point, region);
                } else {
                    inside = (point.x >= region.x && point.x <= region.x + region.width &&
                              point.y >= region.y && point.y <= region.y + region.height);
                }
            }

            if (inside) {
                multiplier = Math.max(multiplier, region.multiplier || 1.0);
            }
        }
        return multiplier;
    }

    interpolate(q1, q2, t, pathData) {
        return interpolateConfig(q1, q2, t);
    }
}
