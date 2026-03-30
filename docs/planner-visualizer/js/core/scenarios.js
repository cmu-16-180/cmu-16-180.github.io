/**
 * Scenario Definitions
 * Defines standard and procedural environments for the motion planner.
 */

import { generateMazeObstacles } from './generators/maze.js';

export const SCENARIOS = {
    empty: {
        name: "Empty",
        start: { x: 1, y: 9 },
        goals: [{ type: 'circle', x: 9, y: 1, radius: 1 }],
        obstacles: [],
        costRegions: []
    },
    center_obstacle: {
        name: "Center Obstacle",
        start: { x: 1, y: 5 },
        goals: [{ type: 'circle', x: 9, y: 5, radius: 1 }],
        obstacles: [
            { type: 'circle', x: 5, y: 5, radius: 2 }
        ],
        costRegions: [
            { type: 'circle', x: 5, y: 8.5, radius: 1.0, multiplier: 5.0 } // Optional mud
        ]
    },
    narrow_corridor: {
        name: "Narrow Corridor",
        start: { x: 1, y: 5 },
        goals: [{ type: 'circle', x: 9, y: 5, radius: 1 }],
        obstacles: [
            // Top wall
            { type: 'polygon', points: [{x:4, y:6}, {x:6, y:6}, {x:6, y:10}, {x:4, y:10}] },
            // Bottom wall
            { type: 'polygon', points: [{x:4, y:0}, {x:6, y:0}, {x:6, y:4}, {x:4, y:4}] }
        ],
        costRegions: []
    },
    simple_maze: {
        name: "Simple Maze",
        start: { x: 1, y: 9 },
        goals: [{ type: 'circle', x: 9, y: 1, radius: 1 }],
        obstacles: [
            { type: 'polygon', points: [{x:2, y:2}, {x:3, y:2}, {x:3, y:10}, {x:2, y:10}] },
            { type: 'polygon', points: [{x:5, y:0}, {x:6, y:0}, {x:6, y:8}, {x:5, y:8}] },
            { type: 'polygon', points: [{x:8, y:2}, {x:9, y:2}, {x:9, y:10}, {x:8, y:10}] }
        ],
        costRegions: []
    },
    complex_maze: {
        name: "Complex Maze",
        dynamic: true, 
        robotRadius: 0.25, 
        start: { x: 0.5, y: 0.5 }, 
        goals: [{ type: 'circle', x: 9.5, y: 9.5, radius: 0.4 }], 
        generator: generateMazeObstacles
    }
};

export function getScenario(key) {
    const config = SCENARIOS[key];
    if (!config) return SCENARIOS.center_obstacle;

    const scenario = {
        start: { ...config.start },
        goals: JSON.parse(JSON.stringify(config.goals)),
        costRegions: JSON.parse(JSON.stringify(config.costRegions || [])),
        robotRadius: config.robotRadius, 
        obstacles: []
    };

    if (config.dynamic && config.generator) {
        scenario.obstacles = config.generator();
    } else {
        scenario.obstacles = JSON.parse(JSON.stringify(config.obstacles));
    }

    return scenario;
}
