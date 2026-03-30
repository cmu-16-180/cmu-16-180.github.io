/**
 * Main Application Entry Point
 * Wires together Model, View, and Controller.
 */

import { Graph } from './core/graph.js';
import { Holonomic2D } from './robots/holonomic2d.js';
import { RRT } from './planners/rrt.js';
import { SimulationController } from './controller/simulation.js';
import { Renderer } from './view/renderer.js';
import { UI } from './view/ui.js';

// 1. Setup Model
const graph = new Graph();
const robot = new Holonomic2D(0.5); // 0.5m radius

// 2. Setup Planner (Scenario loaded later by UI)
const planner = new RRT(robot, graph);

// 3. Setup Controller
const controller = new SimulationController(planner);

// 4. Setup View
const svgElement = document.getElementById('workspace-svg');
const renderer = new Renderer(svgElement, robot, graph);
const ui = new UI(controller, renderer);

// 5. Initial Load
// Load the default "Center Obstacle" scenario
ui.loadScenario('center_obstacle');

console.log("Application Initialized");
