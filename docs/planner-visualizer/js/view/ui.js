// ... imports
import { getScenario } from '../core/scenarios.js';
import { RRT } from '../planners/rrt.js';
import { RRTStar } from '../planners/rrt_star.js';
import { RRTConnect } from '../planners/rrt_connect.js';
import { PRM } from '../planners/prm.js';
import { InteractionManager } from './interaction.js'; 
import { Holonomic2D } from '../robots/holonomic2d.js';
import { DubinsRobot } from '../robots/dubins.js';
import { ReedsSheppRobot } from '../robots/reeds_shepp.js'; // NEW

export class UI {
    // ... constructor, init ...
    constructor(controller, renderer) {
        this.controller = controller;
        this.renderer = renderer;

        this.svg = document.getElementById('workspace-svg');
        this.interaction = new InteractionManager(controller, renderer, this.svg, {
            onSelect: (obj) => this.onObjectSelected(obj),
            onDeselect: () => this.onObjectDeselected(),
            onDragUpdate: () => this.onDragUpdate(),
            onDragEnd: (info) => this.onDragEnd(info)
        });

        this.panelStandard = document.getElementById('panel-standard');
        this.panelContext = document.getElementById('panel-context');
        
        this.selectScenario = document.getElementById('select-scenario');
        this.selectPlanner = document.getElementById('select-planner');
        this.selectSampler = document.getElementById('select-sampler');
        this.selectRobot = document.getElementById('select-robot');
        
        this.ctrlStepSize = document.getElementById('ctrl-step-size');
        this.inputStepSize = document.getElementById('input-step-size');
        this.valStepSize = document.getElementById('val-step-size');
        this.ctrlGoalBias = document.getElementById('ctrl-goal-bias');
        this.inputGoalBias = document.getElementById('input-goal-bias');
        this.valGoalBias = document.getElementById('val-goal-bias');
        this.ctrlRewireRadius = document.getElementById('ctrl-rewire-radius');
        this.inputRewireRadius = document.getElementById('input-rewire-radius');
        this.valRewireRadius = document.getElementById('val-rewire-radius');
        this.ctrlInformed = document.getElementById('ctrl-informed');
        this.chkInformed = document.getElementById('chk-informed');
        this.ctrlGreedy = document.getElementById('ctrl-greedy');
        this.chkGreedy = document.getElementById('chk-greedy');
        this.ctrlPrmRadius = document.getElementById('ctrl-prm-radius');
        this.inputPrmRadius = document.getElementById('input-prm-radius');
        this.valPrmRadius = document.getElementById('val-prm-radius');
        this.ctrlPrmK = document.getElementById('ctrl-prm-k');
        this.inputPrmK = document.getElementById('input-prm-k');
        this.valPrmK = document.getElementById('val-prm-k');

        this.chkShowRejected = document.getElementById('chk-show-rejected');
        this.chkShowGrid = document.getElementById('chk-show-grid');

        this.ctxHeader = document.getElementById('ctx-header');
        this.ctxContent = document.getElementById('ctx-content');
        this.btnCloseContext = document.getElementById('btn-close-context');
        this.btnDeleteObject = document.getElementById('btn-delete-object');

        this.btnRun = document.getElementById('btn-run');
        this.textRun = document.getElementById('text-run');
        this.iconPlay = document.getElementById('icon-play');
        this.iconPause = document.getElementById('icon-pause');
        this.inputSpeed = document.getElementById('input-speed');
        this.valSpeed = document.getElementById('val-speed');
        
        this.toolbar = document.getElementById('toolbar-tools');
        this.btnClear = document.getElementById('btn-clear-graph');

        this.infoNodes = document.getElementById('info-nodes').querySelector('span');
        this.infoEdges = document.getElementById('info-edges').querySelector('span');
        this.infoPath = document.getElementById('info-path');

        this.init();
    }

    init() {
        this.bindGlobalEvents();
        this.bindContextEvents();
        this.startStatsLoop();
        this.updateAlgorithmControls(this.selectPlanner.value);
        if (this.chkShowRejected && this.renderer.layers.rejected) {
            this.renderer.layers.rejected.style.display = this.chkShowRejected.checked ? '' : 'none';
        }
        if (this.chkShowGrid && this.renderer.layers.grid) {
            this.renderer.layers.grid.style.display = this.chkShowGrid.checked ? '' : 'none';
        }
    }

    // --- Interaction Callbacks ---
    onObjectSelected(obj) {
        this.panelStandard.classList.add('hidden');
        this.panelContext.classList.remove('hidden');
        this.populateContextPanel(obj);
        if (this.interaction.activeTool === 'select') {
             this.updateToolbarState('select');
        }
    }

    onObjectDeselected() {
        this.panelContext.classList.add('hidden');
        this.panelStandard.classList.remove('hidden');
        this.updateToolbarState('select');
    }

    onDragUpdate() {
        if (this.interaction.selectedObject) {
            this.updateContextInputsFromModel(this.interaction.selectedObject);
        }
    }

    onDragEnd(info) {
        if (info.type === 'drawing') {
            this.updateToolbarState('select');
        }
    }

    updateToolbarState(activeTool) {
         document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active', 'bg-blue-100', 'text-blue-600'));
         const btn = document.querySelector(`[data-tool="${activeTool}"]`);
         if (btn) btn.classList.add('active', 'bg-blue-100', 'text-blue-600');
    }

    bindGlobalEvents() {
        this.btnRun.addEventListener('click', () => {
            if (this.controller.isRunning) {
                this.controller.stop();
                this.updateRunButton(false);
            } else {
                const hasSolution = !!this.controller.planner.getSolution();
                if (hasSolution) {
                    this.controller.step(1000);
                } else {
                    this.controller.start();
                    this.updateRunButton(true);
                }
            }
        });

        this.selectScenario.addEventListener('change', (e) => { this.loadScenario(e.target.value); });
        this.selectPlanner.addEventListener('change', (e) => { this.switchPlanner(e.target.value); });
        this.selectRobot.addEventListener('change', (e) => { this.switchRobot(e.target.value); }); // Linked here

        this.selectSampler.addEventListener('change', (e) => { this.controller.planner.updateParameters({ sampler: e.target.value }); });
        
        this.inputStepSize.addEventListener('input', (e) => { 
            const val = parseFloat(e.target.value);
            this.valStepSize.textContent = val + "m";
            this.controller.planner.updateParameters({ stepSize: val }); 
        });
        // ... (rest of standard params)
        this.inputGoalBias.addEventListener('input', (e) => { 
            const val = parseFloat(e.target.value);
            this.valGoalBias.textContent = Math.round(val * 100) + "%";
            this.controller.planner.updateParameters({ goalBias: val }); 
        });
        this.inputRewireRadius.addEventListener('input', (e) => { 
            const val = parseFloat(e.target.value);
            this.valRewireRadius.textContent = val + "m";
            this.controller.planner.updateParameters({ rewireRadius: val }); 
        });
        this.chkInformed.addEventListener('change', (e) => this.controller.planner.updateParameters({ informed: e.target.checked }));
        this.chkGreedy.addEventListener('change', (e) => this.controller.planner.updateParameters({ greedy: e.target.checked }));
        this.inputPrmRadius.addEventListener('input', (e) => { 
            const val = parseFloat(e.target.value);
            this.valPrmRadius.textContent = val + "m";
            this.controller.planner.updateParameters({ connectionRadius: val }); 
        });
        this.inputPrmK.addEventListener('input', (e) => { 
            const val = parseInt(e.target.value);
            this.valPrmK.textContent = val;
            this.controller.planner.updateParameters({ kNeighbors: val }); 
        });

        this.chkShowRejected.addEventListener('change', (e) => {
            if (this.renderer.layers.rejected) this.renderer.layers.rejected.style.display = e.target.checked ? '' : 'none';
        });
        this.chkShowGrid.addEventListener('change', (e) => {
            if (this.renderer.layers.grid) this.renderer.layers.grid.style.display = e.target.checked ? '' : 'none';
        });
        this.inputSpeed.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.controller.setSpeed(val);
            this.valSpeed.textContent = val + " SPS";
        });
        ['1', '10', '100'].forEach(count => {
            document.getElementById(`btn-step-${count}`).addEventListener('click', () => { this.controller.step(parseInt(count)); });
        });
        this.btnClear.addEventListener('click', () => {
            this.controller.planner.graph.clear();
            if (this.controller.planner.graphReverse) this.controller.planner.graphReverse.clear();
            this.controller.planner.initialize(this.controller.planner.startConfig, this.controller.planner.goalRegions);
            this.updateRunButton(false);
            this.controller.stop();
        });
        this.toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.tool-btn');
            if (!btn) return;
            const tool = btn.dataset.tool;
            this.interaction.setTool(tool);
            this.updateToolbarState(tool);
        });
    }

    switchRobot(type) {
        this.controller.stop();
        this.updateRunButton(false);
        this.controller.planner.graph.clear();
        if (this.controller.planner.graphReverse) this.controller.planner.graphReverse.clear();

        // Instantiate new Robot
        let newRobot;
        if (type === 'dubins') {
            newRobot = new DubinsRobot();
        } else if (type === 'reeds_shepp') {
            newRobot = new ReedsSheppRobot();
        } else {
            newRobot = new Holonomic2D();
        }

        const oldRobot = this.controller.planner.robot;
        newRobot.setEnvironment(oldRobot.obstacles, oldRobot.costRegions);
        
        this.renderer.robot = newRobot; 
        
        const currentPlannerType = this.selectPlanner.value;
        const graph = this.controller.planner.graph;
        
        let newPlanner;
        if (currentPlannerType === 'rrt_star') newPlanner = new RRTStar(newRobot, graph);
        else if (currentPlannerType === 'rrt_connect') {
            newPlanner = new RRTConnect(newRobot, graph);
            this.renderer.setSecondaryGraph(newPlanner.graphReverse);
        } else if (currentPlannerType === 'prm') newPlanner = new PRM(newRobot, graph);
        else newPlanner = new RRT(newRobot, graph);
        
        const start = this.controller.planner.startConfig;
        const goals = this.controller.planner.goalRegions;
        
        if (newRobot.hasOrientation && start.theta === undefined) {
            start.theta = 0;
        }

        newPlanner.initialize(start, goals);

        // Sync Params
        newPlanner.updateParameters({
            sampler: this.selectSampler.value,
            stepSize: parseFloat(this.inputStepSize.value),
            goalBias: parseFloat(this.inputGoalBias.value),
            rewireRadius: parseFloat(this.inputRewireRadius.value),
            informed: this.chkInformed.checked,
            greedy: this.chkGreedy.checked,
            connectionRadius: parseFloat(this.inputPrmRadius.value),
            kNeighbors: parseInt(this.inputPrmK.value)
        });

        this.controller.setPlanner(newPlanner);
        this.bindPlannerEvents(newPlanner);
        
        this.renderer.updateEnvironment(); 
        this.interaction.deselect();
    }

    // ... (rest of methods preserved same as before) ...
    // Note: I will include them to ensure file integrity.
    
    switchPlanner(type) {
        this.controller.stop();
        this.updateRunButton(false);
        this.controller.planner.graph.clear();
        this.renderer.setSecondaryGraph(null);
        const robot = this.controller.planner.robot;
        const graph = this.controller.planner.graph;
        let newPlanner;
        if (type === 'rrt_star') newPlanner = new RRTStar(robot, graph);
        else if (type === 'rrt_connect') {
            newPlanner = new RRTConnect(robot, graph);
            this.renderer.setSecondaryGraph(newPlanner.graphReverse);
        } else if (type === 'prm') newPlanner = new PRM(robot, graph);
        else newPlanner = new RRT(robot, graph);
        newPlanner.initialize(this.controller.planner.startConfig, this.controller.planner.goalRegions);
        newPlanner.updateParameters({
            sampler: this.selectSampler.value,
            stepSize: parseFloat(this.inputStepSize.value),
            goalBias: parseFloat(this.inputGoalBias.value),
            rewireRadius: parseFloat(this.inputRewireRadius.value),
            informed: this.chkInformed.checked,
            greedy: this.chkGreedy.checked,
            connectionRadius: parseFloat(this.inputPrmRadius.value),
            kNeighbors: parseInt(this.inputPrmK.value)
        });
        this.controller.setPlanner(newPlanner);
        this.updateAlgorithmControls(type);
        this.bindPlannerEvents(newPlanner);
    }
    
    updateAlgorithmControls(type) {
        this.ctrlGoalBias.classList.add('hidden');
        this.ctrlRewireRadius.classList.add('hidden');
        this.ctrlInformed.classList.add('hidden');
        this.ctrlGreedy.classList.add('hidden');
        this.ctrlPrmRadius.classList.add('hidden');
        this.ctrlPrmK.classList.add('hidden');
        this.ctrlStepSize.classList.remove('hidden');
        if (type === 'rrt') {
            this.ctrlGoalBias.classList.remove('hidden');
        } else if (type === 'rrt_star') {
            this.ctrlGoalBias.classList.remove('hidden');
            this.ctrlRewireRadius.classList.remove('hidden');
            this.ctrlInformed.classList.remove('hidden');
        } else if (type === 'rrt_connect') {
            this.ctrlGreedy.classList.remove('hidden');
        } else if (type === 'prm') {
            this.ctrlStepSize.classList.add('hidden'); 
            this.ctrlPrmRadius.classList.remove('hidden');
            this.ctrlPrmK.classList.remove('hidden');
        }
    }

    loadScenario(key) {
        const scenario = getScenario(key);
        this.controller.stop();
        this.updateRunButton(false);
        this.controller.planner.graph.clear();
        if (this.controller.planner.graphReverse) this.controller.planner.graphReverse.clear();
        const robot = this.controller.planner.robot;
        if (scenario.robotRadius !== undefined && robot.setRadius) {
            robot.setRadius(scenario.robotRadius);
        } else if (robot.setRadius) {
            robot.setRadius(0.5);
        }
        this.controller.planner.robot.setEnvironment(scenario.obstacles, scenario.costRegions);
        this.controller.planner.initialize(scenario.start, scenario.goals);
        this.renderer.drawEnvironment(scenario.obstacles, scenario.goals, scenario.start);
        this.interaction.deselect();
    }

    bindPlannerEvents(planner) {
        this.renderer.bindPlannerEvents(planner);
        planner.addEventListener('SOLUTION_FOUND', ({solution}) => {
            this.renderer.drawSolution(solution);
            if (!(planner instanceof RRTStar)) {
                this.updateRunButton(false);
                this.controller.stop();
            } else {
                this.updateRunButton(true);
            }
        });
        planner.addEventListener('SOLUTION_UPDATED', ({solution}) => {
            this.renderer.drawSolution(solution);
        });
    }

    startStatsLoop() {
        this.bindPlannerEvents(this.controller.planner);
        setInterval(() => {
            const planner = this.controller.planner;
            const graph = planner.graph;
            const sol = planner.getSolution();
            this.infoNodes.innerText = graph.nodes.size;
            if (planner.graphReverse) this.infoNodes.innerText += ` + ${planner.graphReverse.nodes.size}`;
            this.infoEdges.innerText = graph.edges.size;
            if (sol) {
                this.infoPath.innerText = `${sol.cost.toFixed(2)}m (${sol.segments} seg)`;
                if (planner instanceof RRTStar && planner.informed) {
                    this.renderer.drawEllipse(planner.getInformedEllipse());
                } else {
                    this.renderer.drawEllipse(null);
                }
                if (!this.controller.isRunning) {
                     this.textRun.innerText = "Continue (+1000)";
                }
            } else {
                this.infoPath.innerText = "N/A";
                this.renderer.drawEllipse(null);
            }
        }, 100);
    }

    bindContextEvents() {
        this.btnCloseContext.addEventListener('click', () => this.interaction.deselect());
        this.btnDeleteObject.addEventListener('click', () => {
            const selected = this.interaction.selectedObject;
            if (!selected || selected.type === 'robot') return;
            const { type, index } = selected;
            
            if (type === 'obstacle') {
                this.controller.planner.robot.obstacles.splice(index, 1);
            } else if (type === 'cost') {
                this.controller.planner.robot.costRegions.splice(index, 1);
            } else if (type === 'goal') {
                if (this.controller.planner.goalRegions.length > 1) {
                    this.controller.planner.goalRegions.splice(index, 1);
                } else {
                    alert("Cannot delete the last goal!");
                    return;
                }
            }
            this.renderer.updateEnvironment();
            this.controller.planner.repairGraph();
            this.interaction.deselect();
        });
    }

    populateContextPanel(selectedObject) {
        if (!selectedObject) return;
        const { type, ref } = selectedObject;
        this.ctxHeader.innerText = `Properties: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        this.ctxContent.innerHTML = '';
        this.addInputGroup('Position', [
            { label: 'X (m)', value: ref.x, key: 'x', min: 0, max: 10, step: 0.1 },
            { label: 'Y (m)', value: ref.y, key: 'y', min: 0, max: 10, step: 0.1 }
        ]);
        if (ref.radius !== undefined) {
            this.addInputGroup('Geometry', [
                { label: 'Radius (m)', value: ref.radius, key: 'radius', min: 0.1, max: 5, step: 0.1 }
            ]);
        }
        if (ref.width !== undefined && ref.height !== undefined) {
            this.addInputGroup('Geometry', [
                { label: 'Width (m)', value: ref.width, key: 'width', min: 0.1, max: 10, step: 0.1 },
                { label: 'Height (m)', value: ref.height, key: 'height', min: 0.1, max: 10, step: 0.1 }
            ]);
        }
        if (type === 'cost') {
            this.addSlider('Cost Multiplier', ref.multiplier || 1.0, 0.1, 10.0, 0.1, 'x', (val) => {
                ref.multiplier = val;
                this.renderer.updateEnvironment();
            });
        }
        
        const robot = this.controller.planner.robot;
        if (type === 'robot' || type === 'goal') {
             if (robot.hasOrientation) {
                 const currentTheta = ref.theta || 0;
                 const currentDeg = Math.round(currentTheta * 180 / Math.PI);
                 this.addSlider('Orientation', currentDeg, -180, 180, 5, '°', (val) => {
                     ref.theta = val * Math.PI / 180;
                     this.renderer.updateEnvironment();
                 }, 'input-theta', 'val-theta');
             }
        }

        if (type === 'robot') {
            this.btnDeleteObject.classList.add('opacity-50', 'cursor-not-allowed');
            this.btnDeleteObject.disabled = true;
        } else {
            this.btnDeleteObject.classList.remove('opacity-50', 'cursor-not-allowed');
            this.btnDeleteObject.disabled = false;
        }
    }

    addInputGroup(title, inputs) {
        const group = document.createElement('div');
        group.className = "space-y-2";
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-2 gap-2";
        inputs.forEach(def => {
            const wrapper = document.createElement('div');
            const label = document.createElement('label');
            label.className = "block text-xs font-medium text-gray-500 mb-1";
            label.innerText = def.label;
            const input = document.createElement('input');
            input.type = "number";
            input.className = "w-full text-sm border-gray-300 rounded p-1.5 focus:ring-purple-500 focus:border-purple-500";
            input.value = def.value.toFixed(2);
            input.min = def.min;
            input.max = def.max;
            input.step = def.step;
            input.dataset.key = def.key;
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    this.interaction.selectedObject.ref[def.key] = val;
                    this.renderer.updateEnvironment();
                }
            });
            input.addEventListener('change', () => {
                 if (this.interaction.selectedObject.type !== 'robot' && this.interaction.selectedObject.type !== 'goal') {
                     this.controller.planner.repairGraph();
                 } else {
                     if (this.interaction.selectedObject.type === 'robot') {
                         this.controller.planner.reconnect(this.interaction.selectedObject.ref);
                     } else {
                         this.controller.planner.updateGoals(this.controller.planner.goalRegions);
                     }
                 }
            });
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            grid.appendChild(wrapper);
        });
        group.appendChild(grid);
        this.ctxContent.appendChild(group);
    }

    addSlider(labelStr, value, min, max, step, unit, onChange, idInput=null, idVal=null) {
        const wrapper = document.createElement('div');
        const header = document.createElement('div');
        header.className = "flex justify-between";
        const label = document.createElement('label');
        label.className = "block text-sm text-gray-600";
        label.innerText = labelStr;
        const span = document.createElement('span');
        span.className = "text-xs text-gray-400 font-bold";
        if (idVal) span.id = idVal;
        span.innerText = value + unit;
        header.appendChild(label);
        header.appendChild(span);
        const input = document.createElement('input');
        input.type = "range";
        if (idInput) input.id = idInput;
        input.className = "slider-properties";
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            span.innerText = val + unit;
            onChange(val);
        });
        wrapper.appendChild(header);
        wrapper.appendChild(input);
        this.ctxContent.appendChild(wrapper);
    }

    updateContextInputsFromModel() {
        const inputs = this.ctxContent.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            const key = input.dataset.key;
            if (key && this.interaction.selectedObject.ref[key] !== undefined) {
                input.value = this.interaction.selectedObject.ref[key].toFixed(2);
            }
        });
    }

    updateRunButton(isRunning) {
        if (isRunning) {
            this.btnRun.classList.remove('bg-green-600', 'hover:bg-green-700');
            this.btnRun.classList.add('bg-red-600', 'hover:bg-red-700');
            this.iconPlay.classList.add('hidden');
            this.iconPause.classList.remove('hidden');
            this.textRun.innerText = "Stop / Pause";
        } else {
            this.btnRun.classList.remove('bg-red-600', 'hover:bg-red-700');
            this.btnRun.classList.add('bg-green-600', 'hover:bg-green-700');
            this.iconPlay.classList.remove('hidden');
            this.iconPause.classList.add('hidden');
            
            if (this.controller.planner.getSolution()) {
                this.textRun.innerText = "Continue (+1000)";
            } else {
                this.textRun.innerText = "Run until solved";
            }
        }
    }
}
