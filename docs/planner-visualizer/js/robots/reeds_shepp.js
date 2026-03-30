/**
 * Reeds-Shepp Car Robot Implementation
 * Reversible non-holonomic robot.
 */

import { RobotBase } from './robot_base.js';
import { ReedsShepp } from '../utils/reeds_shepp.js';
import { createSampler, SAMPLERS } from '../core/sampling.js';
import { toSVG } from '../utils/geometry.js';

export class ReedsSheppRobot extends RobotBase {
    constructor(radius = 1.0, width = 0.5, length = 1.0) {
        super();
        this.radius = radius;
        this.width = width;
        this.length = length;
        this.reverseCost = 1.0; // Multiplier for reverse motion
        
        this.hasOrientation = true;
        this.rs = new ReedsShepp(this.radius);
    }
    
    setRadius(r) {
        this.radius = r;
        this.rs = new ReedsShepp(this.radius);
    }

    setReverseCost(cost) {
        this.reverseCost = cost;
    }

    getSample(strategy = 'UNIFORM', index = 0, rng = undefined) {
        const sampler = createSampler(strategy);
        if (strategy === SAMPLERS.HALTON) sampler.index = index; 
        else if (strategy === SAMPLERS.GRID) sampler.currentCell = index;
        
        const pos = sampler.getSample(rng);
        const r = rng ? rng : { next: Math.random };
        pos.theta = r.next() * 2 * Math.PI - Math.PI;
        return pos;
    }

    distance(q1, q2) {
        // Weighted distance: sum of |segment_len| * weight
        const path = this.rs.getShortestPath(q1, q2);
        let dist = 0;
        for (const len of path.segmentLengths) {
            const weight = len < 0 ? this.reverseCost : 1.0;
            dist += Math.abs(len) * weight;
        }
        return dist;
    }

    steer(start, goal, maxStep) {
        const path = this.rs.getShortestPath(start, goal);
        
        // Calculate true weighted length first
        let totalWeightedLen = 0;
        for (const len of path.segmentLengths) {
            totalWeightedLen += Math.abs(len) * (len < 0 ? this.reverseCost : 1.0);
        }

        // Reeds-Shepp paths are complex to clip based on weighted distance.
        // We will sample along the GEOMETRIC length, but return the weighted cost.
        
        let endConfig = goal;
        
        if (path.length > maxStep) {
            endConfig = this.rs.sample(start, path, maxStep);
        }

        // Calculate Cost (Terrain + Reverse Penalty)
        const cost = this.cost(start, endConfig, path);

        return {
            path: path, 
            endConfig: endConfig,
            cost: cost
        };
    }

    /**
     * Override cost to include reverse penalty AND terrain.
     */
    cost(q1, q2, pathData) {
        if (!pathData) pathData = this.rs.getShortestPath(q1, q2);

        // We use the discrete integrator from RobotBase to handle Terrain.
        // RobotBase.interpolate calls our interpolate().
        // However, RobotBase doesn't know about reverse penalty.
        // We can bake reverse penalty into the multiplier logic? No, that's terrain.
        // Easier:
        // We iterate steps. interpolate() gives us config. 
        // We can detect direction by comparing current config to last config relative to heading?
        // OR: Since we have the path segments, we know which gear we are in at distance 'd'.
        
        const dist = this.rs.getShortestPath(q1, q2).length; // Actual geometric length of this sub-segment
        // Note: 'pathData' passed in might be the full path (start->goal), 
        // while q1->q2 is a sub-segment (start->steered).
        // Using sample logic allows consistent interpolation.
        
        const steps = Math.ceil(dist / this.integrationStepSize);
        let totalCost = 0;
        let lastConfig = q1;

        // Note: This naive integration re-calculates geometric direction.
        // To strictly apply reverse penalty, we need to know the 'gear' at time t.
        // This is hard with just interpolate(t).
        // Approximation:
        // If we compute the basic terrain cost using super.cost(), we get Distance * Terrain.
        // We can add a factor: Distance * (Terrain + (isReverse ? ReversePenalty-1 : 0)).
        
        // Let's manually implement loop to be precise.
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            
            // We need the geometric distance along the full path to check gear
            // q1 might be start, q2 might be intermediate.
            // If pathData is the full path, we interpret 't' as fraction of q1->q2 geometric length.
            // But we don't know where q1 starts on pathData easily if it's a random segment.
            // For RRT 'steer', q1 is always start of pathData.
            
            const currentDist = dist * t;
            const currentConfig = this.rs.sample(q1, pathData, currentDist);
            
            // Check Gear
            const gear = this.getGearAtDistance(pathData, currentDist);
            const penalty = gear < 0 ? this.reverseCost : 1.0;
            
            // Terrain
            const stepDist = Math.sqrt((currentConfig.x-lastConfig.x)**2 + (currentConfig.y-lastConfig.y)**2);
            const terrain = this.getCostMultiplierAt(currentConfig);
            
            totalCost += stepDist * terrain * penalty;
            lastConfig = currentConfig;
        }
        return totalCost;
    }

    getGearAtDistance(pathData, d) {
        let remaining = d;
        for (const len of pathData.segmentLengths) {
            const absLen = Math.abs(len);
            if (remaining <= absLen) return Math.sign(len);
            remaining -= absLen;
        }
        return 1; // Default
    }

    interpolate(q1, q2, t, pathData) {
        if (!pathData) pathData = this.rs.getShortestPath(q1, q2);
        // We assume q1 is start of pathData.
        const totalDist = pathData.length; 
        
        // Wait! If q2 is an intermediate point (clipped), pathData.length is the FULL length.
        // We need to interpolate 0..1 between q1 and q2.
        // We need distance(q1, q2) geometrically.
        // But RS distance() returns weighted. We need geometric for sampling.
        // Let's recalculate shortest path for q1->q2 to get geometric length? 
        // No, that changes the curve.
        // If pathData is provided, it's the curve.
        
        // This suggests we need to know the geometric length of the sub-segment q1->q2.
        // In steer(), if clipped, we know we clipped at 'maxStep'.
        // If unclipped, length is pathData.length.
        // But isValidLink calls interpolate. It calculates steps based on Weighted Distance.
        // This is messy.
        
        // Simplified approach for MVP: 
        // 1. Calculate geometric distance between q1, q2 (Euclidean approx or assume maxStep logic).
        // 2. Use that to drive 't'.
        
        // Let's use the helper: sample assumes distance from start.
        // If isValidLink passes t=0.5, it wants the config halfway between q1 and q2.
        // We can just guess the dist?
        // Or recompute RS path for q1->q2? If we recompute, we might get a different path type if q2 is close.
        // This is a known issue in non-holonomic RRTs.
        
        // Robust fix: Generate a fresh path for q1->q2 for validation/drawing.
        const localPath = this.rs.getShortestPath(q1, q2);
        return this.rs.sample(q1, localPath, localPath.length * t);
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
        // Always regenerate path to ensure we draw exactly q1->q2
        pathData = this.rs.getShortestPath(q1, q2);

        const startSVG = toSVG(q1.x, q1.y);
        let d = `M ${startSVG.x} ${startSVG.y}`;
        
        const segmentLen = pathData.length;
        const numSamples = Math.max(2, Math.ceil(segmentLen * 5));
        
        for (let i = 1; i <= numSamples; i++) {
            const dist = (i / numSamples) * segmentLen;
            const pt = this.rs.sample(q1, pathData, dist);
            const svgPt = toSVG(pt.x, pt.y);
            d += ` L ${svgPt.x} ${svgPt.y}`;
        }
        
        return d;
    }
}
