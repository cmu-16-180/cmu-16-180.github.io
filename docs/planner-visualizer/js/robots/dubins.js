/**
 * Dubins Car Robot Implementation
 * Non-holonomic robot with minimum turning radius.
 */

import { RobotBase } from './robot_base.js';
import { Dubins } from '../utils/dubins.js';
import { createSampler, SAMPLERS } from '../core/sampling.js';
import { WORKSPACE_SIZE, toSVG } from '../utils/geometry.js';

export class DubinsRobot extends RobotBase {
    constructor(radius = 1.0, width = 0.5, length = 1.0) {
        super();
        this.radius = radius;
        this.width = width;
        this.length = length;
        
        this.hasOrientation = true;
        this.dubins = new Dubins(this.radius);
    }
    
    // Allow updating radius from UI
    setRadius(r) {
        this.radius = r;
        this.dubins = new Dubins(this.radius);
    }

    getSample(strategy = 'UNIFORM', index = 0, rng = undefined) {
        const sampler = createSampler(strategy);
        if (strategy === SAMPLERS.HALTON) sampler.index = index; 
        else if (strategy === SAMPLERS.GRID) sampler.currentCell = index;
        
        const pos = sampler.getSample(rng);
        
        // Add random theta
        const r = rng ? rng : { next: Math.random };
        pos.theta = r.next() * 2 * Math.PI - Math.PI; // [-PI, PI]
        
        return pos;
    }

    distance(q1, q2) {
        return this.dubins.getShortestPath(q1, q2).length;
    }

    steer(start, goal, maxStep) {
        const path = this.dubins.getShortestPath(start, goal);
        
        let endConfig = goal;
        
        // If path is longer than maxStep, we must clip it.
        if (path.length > maxStep) {
            endConfig = this.dubins.sample(start, path, maxStep);
            // Note: When we clip, we are returning a partial path.
            // The path object from getShortestPath represents the FULL path.
            // But cost calculation needs to know we stopped early.
            // Actually, cost() integrates using interpolate(), which takes t [0,1].
            // RobotBase.cost calculates steps based on distance(start, endConfig).
            // So if we pass endConfig correctly, cost() will integrate the segment correctly.
        }

        // Calculate terrain cost
        // We pass 'path' (the full path geometry) so interpolate knows the shape.
        // Even if endConfig is intermediate, interpolate handles t correctly between start and endConfig?
        // Wait, RobotBase.cost uses t from 0 to 1 between q1 and q2.
        // interpolate(q1, q2, t) calls dubins.sample.
        // We need to ensure interpolate uses the correct path segment.
        const terrainCost = this.cost(start, endConfig, path);

        return {
            path: path, 
            endConfig: endConfig,
            cost: terrainCost
        };
    }

    /**
     * Override cost to prevent numerical explosion on empty maps.
     */
    cost(q1, q2, pathData) {
        // Optimization: If no cost regions, return the analytic path length.
        // This avoids integrating small floating-point errors which can cause 
        // the Dubins solver to return loops for what should be straight lines.
        if (this.costRegions.length === 0) {
            return this.distance(q1, q2);
        }
        
        return super.cost(q1, q2, pathData);
    }

    /**
     * Interpolates along the Dubins curve.
     * Overrides RobotBase.interpolate.
     */
    interpolate(q1, q2, t, pathData) {
        if (!pathData) {
            pathData = this.dubins.getShortestPath(q1, q2);
        }
        
        // The pathData is usually for the Full start->goal. 
        // But q2 might be an intermediate point (result of steer with maxStep).
        // We need the distance along the curve from q1 to q2.
        const distToQ2 = this.distance(q1, q2);
        const distAtT = distToQ2 * t;
        
        return this.dubins.sample(q1, pathData, distAtT);
    }

    getCollisionShape(config) {
        const cos = Math.cos(config.theta);
        const sin = Math.sin(config.theta);
        
        const hw = this.width / 2;
        const hl = this.length / 2;
        
        const corners = [
            { x: hl, y: hw },
            { x: hl, y: -hw },
            { x: -hl, y: -hw },
            { x: -hl, y: hw }
        ];
        
        const points = corners.map(p => ({
            x: config.x + (p.x * cos - p.y * sin),
            y: config.y + (p.x * sin + p.y * cos)
        }));

        return {
            type: 'polygon',
            points: points
        };
    }

    getSVGPath(q1, q2, pathData) {
        if (!pathData) {
            pathData = this.dubins.getShortestPath(q1, q2);
        }

        const startSVG = toSVG(q1.x, q1.y);
        let d = `M ${startSVG.x} ${startSVG.y}`;
        
        // Use polyline approximation for robustness
        // Determine segment length we are drawing (q1 to q2)
        const segmentLen = this.distance(q1, q2);
        
        const numSamples = Math.max(2, Math.ceil(segmentLen * 5)); // 5 samples per meter
        
        for (let i = 1; i <= numSamples; i++) {
            const dist = (i / numSamples) * segmentLen;
            const pt = this.dubins.sample(q1, pathData, dist);
            const svgPt = toSVG(pt.x, pt.y);
            d += ` L ${svgPt.x} ${svgPt.y}`;
        }
        
        return d;
    }
}
