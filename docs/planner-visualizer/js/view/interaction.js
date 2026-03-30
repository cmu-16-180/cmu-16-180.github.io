/**
 * Interaction Manager
 * Handles Canvas interactions (Selection, Dragging, Drawing).
 * Decouples mouse logic from UI form logic.
 */

import { fromSVG, toSVG } from '../utils/geometry.js';

export class InteractionManager {
    constructor(controller, renderer, svgElement, callbacks) {
        this.controller = controller;
        this.renderer = renderer;
        this.svg = svgElement;
        this.callbacks = callbacks || {}; // { onSelect, onDeselect, onDragUpdate, onDragEnd }

        // State
        this.activeTool = 'select';
        this.selectedObject = null; // { type, index, ref }
        this.dragState = null;      // { active, startMouse, startObj }
        this.drawState = null;      // { active, startPt, shape }

        this.bindEvents();
    }

    setTool(tool) {
        this.activeTool = tool;
        this.deselect();
    }

    bindEvents() {
        this.svg.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.svg.addEventListener('dragstart', (e) => e.preventDefault());
    }

    getMousePosition(evt) {
        const CTM = this.svg.getScreenCTM();
        const pt = this.svg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const svgP = pt.matrixTransform(CTM.inverse());
        return fromSVG(svgP.x, svgP.y);
    }

    deselect() {
        this.selectedObject = null;
        if (this.callbacks.onDeselect) this.callbacks.onDeselect();
    }

    select(type, index, ref) {
        this.selectedObject = { type, index, ref };
        if (this.callbacks.onSelect) this.callbacks.onSelect(this.selectedObject);
    }

    onMouseDown(e) {
        // 1. Selection Mode
        if (this.activeTool === 'select') {
            const target = e.target;
            const classList = target.classList;
            
            let type = null;
            let index = -1;
            let ref = null;
            const id = target.getAttribute('id') || '';

            const planner = this.controller.planner;

            if (classList.contains('svg-robot') || target.closest('.svg-robot')) {
                type = 'robot';
                ref = planner.startConfig;
            } else if (id.startsWith('obs-')) {
                type = 'obstacle';
                index = parseInt(id.split('-')[1]);
                ref = planner.robot.obstacles[index];
            } else if (id.startsWith('goal-')) {
                type = 'goal';
                index = parseInt(id.split('-')[1]);
                ref = planner.goalRegions[index];
            } else if (id.startsWith('cost-')) {
                type = 'cost';
                index = parseInt(id.split('-')[1]);
                ref = planner.robot.costRegions[index];
            } else if (target.id === 'bg-grid') {
                this.deselect();
                return;
            }

            if (ref) {
                this.select(type, index, ref);
                const pt = this.getMousePosition(e);
                this.dragState = {
                    active: true,
                    startMouse: pt,
                    startObj: { x: ref.x, y: ref.y }
                };
            }
            return;
        }

        // 2. Drawing Mode
        const pt = this.getMousePosition(e);
        const isCost = this.activeTool.startsWith('cost-');
        const isGoal = this.activeTool.startsWith('goal-');
        const shapeType = this.activeTool.split('-')[1];

        let newShape = null;
        if (shapeType === 'circle') newShape = { type: 'circle', x: pt.x, y: pt.y, radius: 0.1 };
        else if (shapeType === 'rect') newShape = { type: 'rectangle', x: pt.x, y: pt.y, width: 0.1, height: 0.1 };
        else if (shapeType === 'poly') newShape = { type: 'rectangle', x: pt.x, y: pt.y, width: 0.1, height: 0.1 };

        if (newShape) {
            const planner = this.controller.planner;
            if (isCost) {
                newShape.multiplier = 5.0; 
                planner.robot.costRegions.push(newShape);
                this.selectedObject = { type: 'cost', index: planner.robot.costRegions.length - 1, ref: newShape };
            } else if (isGoal) {
                newShape.radius = newShape.radius || 0.5; 
                planner.goalRegions.push(newShape);
                this.selectedObject = { type: 'goal', index: planner.goalRegions.length - 1, ref: newShape };
            } else { 
                planner.robot.obstacles.push(newShape);
                this.selectedObject = { type: 'obstacle', index: planner.robot.obstacles.length - 1, ref: newShape };
            }

            this.drawState = {
                active: true,
                startPt: pt,
                shape: newShape
            };
            
            this.renderer.updateEnvironment();
        }
    }

    onMouseMove(e) {
        const pt = this.getMousePosition(e);

        // A. Drawing
        if (this.drawState && this.drawState.active) {
            const shape = this.drawState.shape;
            const start = this.drawState.startPt;
            const dx = pt.x - start.x;
            const dy = pt.y - start.y;

            if (shape.type === 'circle') {
                shape.radius = Math.sqrt(dx*dx + dy*dy);
            } else if (shape.type === 'rectangle') {
                shape.width = Math.abs(dx);
                shape.height = Math.abs(dy);
                shape.x = dx < 0 ? pt.x : start.x;
                shape.y = dy < 0 ? pt.y : start.y;
            }
            this.renderer.updateEnvironment();
            return;
        }

        // B. Dragging
        if (this.dragState && this.dragState.active && this.selectedObject) {
            const dx = pt.x - this.dragState.startMouse.x;
            const dy = pt.y - this.dragState.startMouse.y;
            const obj = this.selectedObject.ref;
            obj.x = this.dragState.startObj.x + dx;
            obj.y = this.dragState.startObj.y + dy;
            
            // Bounds check
            obj.x = Math.max(0, Math.min(10, obj.x));
            obj.y = Math.max(0, Math.min(10, obj.y));
            
            this.renderer.updateEnvironment();
            if (this.callbacks.onDragUpdate) this.callbacks.onDragUpdate();
        }
    }

    onMouseUp(e) {
        // Finish Drawing
        if (this.drawState && this.drawState.active) {
            this.drawState.active = false;
            const s = this.drawState.shape;
            
            // Remove tiny shapes
            if ((s.type === 'circle' && s.radius < 0.1) || (s.type === 'rectangle' && s.width < 0.1)) {
                const planner = this.controller.planner;
                if (this.selectedObject.type === 'cost') planner.robot.costRegions.pop();
                else if (this.selectedObject.type === 'goal') planner.goalRegions.pop();
                else planner.robot.obstacles.pop();
                
                this.deselect();
                this.renderer.updateEnvironment();
                return;
            }
            
            // Switch to select mode
            this.setTool('select');
            
            // Select new object
            this.select(this.selectedObject.type, this.selectedObject.index, this.selectedObject.ref);
            
            if (this.callbacks.onDragEnd) this.callbacks.onDragEnd({ type: 'drawing', object: this.selectedObject });
            return;
        }

        // Finish Dragging
        if (this.dragState && this.dragState.active) {
            this.dragState.active = false;
            
            const planner = this.controller.planner;
            if (this.selectedObject.type === 'robot') {
                planner.reconnect(this.selectedObject.ref);
            } else if (this.selectedObject.type === 'goal') {
                planner.updateGoals(planner.goalRegions);
            } else {
                planner.repairGraph();
            }

            if (this.callbacks.onDragEnd) this.callbacks.onDragEnd({ type: 'drag', object: this.selectedObject });
        }
    }
}
