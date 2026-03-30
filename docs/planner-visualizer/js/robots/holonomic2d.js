/**
 * Holonomic 2D Robot Implementation
 * Represents a circular robot that can move in any direction (straight lines).
 */

import { RobotBase } from './robot_base.js';
import { interpolateConfig, dist, WORKSPACE_SIZE, toSVG } from '../utils/geometry.js';
import { createSampler, SAMPLERS } from '../core/sampling.js';

export class Holonomic2D extends RobotBase {
    constructor(radius = 0.5) {
        super();
        this.radius = radius;
        this.hasOrientation = false; // Point robot, orientation ignored
    }

    setRadius(r) {
        this.radius = r;
    }

    getSample(strategy = 'UNIFORM', index = 0, rng = undefined) {
        const sampler = createSampler(strategy);
        if (strategy === SAMPLERS.HALTON) sampler.index = index; 
        else if (strategy === SAMPLERS.GRID) sampler.currentCell = index;
        return sampler.getSample(rng);
    }

    distance(q1, q2) {
        return dist(q1, q2);
    }

    steer(start, goal, maxStep) {
        const d = this.distance(start, goal);
        let endConfig = goal;
        
        if (d > maxStep) {
            const t = maxStep / d;
            endConfig = interpolateConfig(start, goal, t);
        }

        const cost = this.cost(start, endConfig, null);

        return {
            path: null, 
            endConfig: endConfig,
            cost: cost 
        };
    }

    getSVGPath(q1, q2, pathData) {
        const p1 = toSVG(q1.x, q1.y);
        const p2 = toSVG(q2.x, q2.y);
        return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }

    getCollisionShape(config) {
        return {
            type: 'circle',
            x: config.x,
            y: config.y,
            radius: this.radius
        };
    }

    interpolate(q1, q2, t, pathData) {
        return interpolateConfig(q1, q2, t);
    }
}
