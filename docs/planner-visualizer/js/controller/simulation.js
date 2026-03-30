/**
 * Simulation Controller
 * Manages the execution loop (requestAnimationFrame), speed control, and time budgeting.
 */

export class SimulationController {
    constructor(planner) {
        this.planner = planner;
        this.isRunning = false;
        
        // Speed control
        // Steps per second. 
        // Low values (<60) use accumulation. 
        // High values (>60) use batching in the loop.
        this.speed = 60; 
        
        // Time tracking
        this.lastFrameTime = 0;
        this.pendingSteps = 0;
        
        // Performance constraints
        this.maxFrameTime = 12; // ms to use per frame (leaving ~4ms for render)
        
        // Bind loop to preserve 'this'
        this._loop = this._loop.bind(this);
        this.rAF_ID = null;
    }

    setPlanner(planner) {
        this.planner = planner;
    }

    setSpeed(sps) {
        this.speed = Math.max(1, sps);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.rAF_ID = requestAnimationFrame(this._loop);
    }

    stop() {
        this.isRunning = false;
        if (this.rAF_ID) {
            cancelAnimationFrame(this.rAF_ID);
            this.rAF_ID = null;
        }
    }

    step(count = 1) {
        // Manual stepping ignores time budget
        for (let i = 0; i < count; i++) {
            this.planner.step();
        }
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        // 1. Calculate how many steps we *should* run this frame
        const targetSteps = this.speed * dt;
        this.pendingSteps += targetSteps;

        // 2. Budget execution
        const startTime = performance.now();
        let stepsExecuted = 0;

        // Run while we have pending steps AND we haven't exceeded time budget
        while (this.pendingSteps >= 1) {
            this.planner.step();
            this.pendingSteps -= 1;
            stepsExecuted++;

            // Check budget every few steps to avoid overhead of performance.now()
            // Checking every 10 steps is a reasonable balance
            if (stepsExecuted % 10 === 0) {
                if (performance.now() - startTime > this.maxFrameTime) {
                    // Budget exhausted. 
                    // Stop here. pendingSteps remains > 0, so they carry over to next frame.
                    // This creates "lag" in simulation time but maintains UI responsiveness (FPS).
                    break;
                }
            }
        }

        // Schedule next frame
        this.rAF_ID = requestAnimationFrame(this._loop);
    }
}
