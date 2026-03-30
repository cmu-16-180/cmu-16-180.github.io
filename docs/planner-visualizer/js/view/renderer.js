/**
 * SVG Renderer
 * Handles visual updates based on Graph/Robot events.
 */

import { toSVG } from '../utils/geometry.js';

export class Renderer {
    constructor(svgElement, robot, graph) {
        this.svg = svgElement;
        this.robot = robot;
        this.graph = graph;
        this.secondaryGraph = null; 

        this.layers = {
            grid: document.getElementById('bg-grid'),
            costRegions: document.getElementById('layer-cost-regions'),
            ellipse: document.getElementById('layer-ellipse'),
            goals: document.getElementById('layer-goals'),
            graph: document.getElementById('layer-graph'),
            graphNodes: document.getElementById('layer-graph-nodes'),
            obstacles: document.getElementById('layer-obstacles'),
            rejected: document.getElementById('layer-rejected'),
            solution: document.getElementById('layer-solution'),
            robot: document.getElementById('layer-robot')
        };

        this.bindEvents(this.graph, false);
    }

    bindPlannerEvents(planner) {
        planner.addEventListener('SAMPLE_REJECTED', (payload) => this.onSampleRejected(payload));
    }

    bindEvents(graph, isSecondary) {
        if (!graph) return;
        graph.addEventListener('NODE_ADDED', (p) => this.onNodeAdded(p, isSecondary));
        graph.addEventListener('EDGE_ADDED', (p) => this.onEdgeAdded(p, isSecondary));
        graph.addEventListener('EDGE_REMOVED', (p) => this.onEdgeRemoved(p, isSecondary));
        graph.addEventListener('CLEAR', () => this.onClear(isSecondary));
    }

    setSecondaryGraph(graph) {
        this.secondaryGraph = graph;
        if (graph) {
            this.bindEvents(graph, true);
        } else {
            this.onClear(true);
        }
    }

    // --- Graph Updates ---

    onNodeAdded({ node }, isSecondary) {
        const p = toSVG(node.config.x, node.config.y);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("class", isSecondary ? "svg-reverse-node" : "svg-graph-node");
        circle.setAttribute("id", `${isSecondary?'sec-':''}node-${node.id}`);
        this.layers.graphNodes.appendChild(circle);
    }

    onEdgeAdded({ edge }, isSecondary) {
        const g = isSecondary ? this.secondaryGraph : this.graph;
        const source = g.nodes.get(edge.sourceId);
        const target = g.nodes.get(edge.targetId);
        if (!source || !target) return;

        // Use Robot to generate path data (supports Curves)
        const d = this.robot.getSVGPath(source.config, target.config, null); // Edge obj doesn't store pathData, assume robot handles simple connectivity or recomputes?
        // Wait, for Dubins, we need the specific pathData that Steer generated. 
        // Our Graph Edge does NOT store pathData currently (for memory).
        // This implies Robot.getSVGPath MUST be able to re-derive the optimal path geometry deterministically from q1, q2.
        // For Holonomic, this is easy (line). For Dubins, there are 6 types, but optimal is unique (mostly).
        // The implementation of getSVGPath in Dubins must re-run the solver.

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("class", isSecondary ? "svg-reverse-edge" : "svg-graph-edge");
        
        // Custom attribute to disable fill, ensure only stroke
        path.setAttribute("fill", "none");

        path.setAttribute("stroke", "#818CF8"); 
        setTimeout(() => {
            path.removeAttribute("stroke");
        }, 200);

        path.setAttribute("id", `${isSecondary?'sec-':''}edge-${edge.id}`);
        this.layers.graph.appendChild(path);
    }

    onEdgeRemoved({ edgeId }, isSecondary) {
        const id = `${isSecondary?'sec-':''}edge-${edgeId}`;
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    onClear(isSecondary) {
        if (isSecondary) {
            const nodes = this.layers.graphNodes.querySelectorAll('.svg-reverse-node');
            nodes.forEach(n => n.remove());
            const edges = this.layers.graph.querySelectorAll('.svg-reverse-edge');
            edges.forEach(e => e.remove());
        } else {
            this.layers.graph.innerHTML = '';
            this.layers.graphNodes.innerHTML = '';
            this.layers.rejected.innerHTML = '';
            this.layers.solution.innerHTML = '';
            this.layers.ellipse.innerHTML = ''; 
        }
    }

    onSampleRejected(payload) {
        if (this.layers.rejected.style.display === 'none') return;

        if (payload.type === 'node') {
            const p = toSVG(payload.config.x, payload.config.y);
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", p.x);
            circle.setAttribute("cy", p.y);
            circle.setAttribute("class", "svg-rejected-node");
            this.layers.rejected.appendChild(circle);
        } else if (payload.type === 'edge') {
            // Updated to use path
            const d = this.robot.getSVGPath(payload.from, payload.to, null);
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            path.setAttribute("class", "svg-rejected-edge");
            path.setAttribute("fill", "none");
            this.layers.rejected.appendChild(path);
        }
    }

    drawSolution(solution) {
        this.layers.solution.innerHTML = '';
        if (!solution || !solution.path) return;

        let fullD = "";
        const nodes = solution.path;
        for (let i = 0; i < nodes.length - 1; i++) {
            const n1 = nodes[i];
            const n2 = nodes[i+1];
            
            // Get path segment
            const d = this.robot.getSVGPath(n1.config, n2.config, null);
            // Append to full path
            // Note: SVG paths can be concatenated if M is handled.
            // getSVGPath returns "M ... L ...".
            // We want one continuous path for styling? Or multiple segments?
            // Continuous is better for stroke-linejoin.
            // If d starts with M, we strip it if i > 0?
            // Dubins path might be complex "M x y L ... A ...".
            // Safest: Just concatenate raw strings. SVG allows multiple M commands in one d attribute (sub-paths).
            fullD += d + " ";
        }

        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("d", fullD);
        pathEl.setAttribute("class", "svg-solution");
        pathEl.setAttribute("fill", "none");
        this.layers.solution.appendChild(pathEl);
    }

    // ... (rest of methods: drawEllipse, updateEnvironment, drawEnvironment, drawArrow, createShapeElement, getShapeCenter) ...
    // Note: Ensuring these exist in the output
    drawEllipse(ellipseData) {
        this.layers.ellipse.innerHTML = '';
        if (!ellipseData) return;

        const center = toSVG(ellipseData.cx, ellipseData.cy);
        const rx = ellipseData.rx * 100; 
        const ry = ellipseData.ry * 100;

        const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        el.setAttribute("cx", center.x);
        el.setAttribute("cy", center.y);
        el.setAttribute("rx", rx);
        el.setAttribute("ry", ry);
        el.setAttribute("transform", `rotate(${-ellipseData.rotation} ${center.x} ${center.y})`);
        el.setAttribute("class", "svg-ellipse");
        this.layers.ellipse.appendChild(el);
    }

    updateEnvironment() {
        this.drawEnvironment(
            this.robot.obstacles,
            this._cachedGoals || [],
            this._cachedStart || {x:0, y:0}
        );
    }

    drawEnvironment(obstacles, goalRegions, startConfig) {
        this._cachedGoals = goalRegions;
        this._cachedStart = startConfig;

        this.layers.costRegions.innerHTML = '';
        if (this.robot.costRegions) {
            this.robot.costRegions.forEach((reg, i) => {
                const el = this.createShapeElement(reg, 'svg-cost-region');
                el.setAttribute('id', `cost-${i}`);
                this.layers.costRegions.appendChild(el);
                if (reg.multiplier) {
                    const center = this.getShapeCenter(reg);
                    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    text.setAttribute("x", center.x);
                    text.setAttribute("y", center.y); 
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("fill", "#78350f");
                    text.setAttribute("font-size", "14");
                    text.setAttribute("font-weight", "bold");
                    text.setAttribute("pointer-events", "none");
                    text.setAttribute("opacity", "0.7");
                    text.textContent = reg.multiplier + "x";
                    this.layers.costRegions.appendChild(text);
                }
            });
        }

        this.layers.obstacles.innerHTML = '';
        obstacles.forEach((obs, i) => {
            const el = this.createShapeElement(obs, 'svg-obstacle');
            el.setAttribute('id', `obs-${i}`);
            this.layers.obstacles.appendChild(el);
        });

        this.layers.goals.innerHTML = '';
        goalRegions.forEach((goal, i) => {
            const el = this.createShapeElement(goal, 'svg-goal');
            el.setAttribute('id', `goal-${i}`);
            this.layers.goals.appendChild(el);
            if (goal.theta !== undefined) {
                this.drawArrow(this.layers.goals, goal, "#22C55E", "url(#arrow-green)");
            }
        });

        this.layers.robot.innerHTML = '';
        const robotShape = this.robot.getCollisionShape(startConfig);
        const robotEl = this.createShapeElement(robotShape, 'svg-robot');
        this.layers.robot.appendChild(robotEl);

        if (startConfig.theta !== undefined) {
            this.drawArrow(this.layers.robot, startConfig, "#EF4444", "url(#arrow-red)");
        }
    }

    drawArrow(layer, config, color, marker) {
        const center = toSVG(config.x, config.y);
        const len = 25; 
        const angle = config.theta || 0;
        const dx = Math.cos(angle) * len;
        const dy = -Math.sin(angle) * len; 

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", center.x - dx*0.5); 
        line.setAttribute("y1", center.y - dy*0.5);
        line.setAttribute("x2", center.x + dx);     
        line.setAttribute("y2", center.y + dy);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "2.5");
        line.setAttribute("marker-end", marker);
        line.setAttribute("pointer-events", "none");
        layer.appendChild(line);
    }

    createShapeElement(shape, className) {
        let el;
        if (shape.type === 'circle') {
            const p = toSVG(shape.x, shape.y);
            const pR = toSVG(shape.x + shape.radius, shape.y);
            const r = Math.abs(pR.x - p.x); 
            el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            el.setAttribute("cx", p.x);
            el.setAttribute("cy", p.y);
            el.setAttribute("r", r);
        } else if (shape.type === 'polygon') {
            el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const pointsStr = shape.points.map(pt => {
                const p = toSVG(pt.x, pt.y);
                return `${p.x},${p.y}`;
            }).join(" ");
            el.setAttribute("points", pointsStr);
        } else if (shape.type === 'rectangle') {
            el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            const topLeft = toSVG(shape.x, shape.y + shape.height);
            const w = shape.width * 100;
            const h = shape.height * 100;
            el.setAttribute("x", topLeft.x);
            el.setAttribute("y", topLeft.y);
            el.setAttribute("width", w);
            el.setAttribute("height", h);
        }
        if (el) el.setAttribute("class", className);
        return el;
    }

    getShapeCenter(shape) {
        if (shape.type === 'circle') return toSVG(shape.x, shape.y);
        if (shape.type === 'rectangle') return toSVG(shape.x + shape.width/2, shape.y + shape.height/2);
        if (shape.type === 'polygon') {
            let sx = 0, sy = 0;
            shape.points.forEach(p => { sx += p.x; sy += p.y; });
            return toSVG(sx / shape.points.length, sy / shape.points.length);
        }
        return {x:0, y:0};
    }
}
