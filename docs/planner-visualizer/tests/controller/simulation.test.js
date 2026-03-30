import { SimulationController } from '../../js/controller/simulation.js';

const expect = window.chai.expect;

describe('Simulation Controller', () => {
    let controller;
    let mockPlanner;
    let stepsRun;

    beforeEach(() => {
        stepsRun = 0;
        mockPlanner = {
            step: () => { stepsRun++; }
        };
        controller = new SimulationController(mockPlanner);
    });

    it('should initialize paused', () => {
        expect(controller.isRunning).to.be.false;
    });

    it('should execute manual steps immediately', () => {
        controller.step(5);
        expect(stepsRun).to.equal(5);
    });

    // Note: Testing the rAF loop in a unit test environment usually requires 
    // mocking requestAnimationFrame and performance.now.
    // For this environment, we'll verify the logic logic by calling _loop manually 
    // with faked timestamps.

    it('should accumulate pending steps for slow speeds', () => {
        controller.isRunning = true;
        controller.setSpeed(10); // 10 steps per second
        controller.lastFrameTime = 1000;

        // Advance 50ms (0.05s). Expected steps: 0.5. Should run 0.
        controller._loop(1050); 
        expect(stepsRun).to.equal(0);
        expect(controller.pendingSteps).to.be.closeTo(0.5, 0.001);

        // Advance another 50ms. Total 0.1s. Expected steps: 1.0. Should run 1.
        controller._loop(1100);
        expect(stepsRun).to.equal(1);
        expect(controller.pendingSteps).to.be.closeTo(0.0, 0.001);
    });

    it('should batch steps for high speeds', () => {
        controller.isRunning = true;
        controller.setSpeed(600); // 600 steps per second (10 per frame at 60fps)
        controller.lastFrameTime = 1000;

        // Advance 16.6ms (approx 1 frame). Expected steps: ~10.
        controller._loop(1016.6);
        expect(stepsRun).to.be.closeTo(10, 1); 
    });

    it('should respect time budget', () => {
        controller.isRunning = true;
        controller.setSpeed(100000); // Huge speed request
        controller.lastFrameTime = 1000;
        
        // Mock a slow planner that takes 1ms per step
        // We override the planner logic for this test
        const start = performance.now();
        mockPlanner.step = () => {
            stepsRun++;
            // Busy wait 1ms
            const s = performance.now();
            while (performance.now() - s < 1);
        };

        // Run loop. Should stop after ~12 steps (12ms budget), 
        // even though speed requested thousands.
        controller._loop(1016); 

        // Allow some variance, but it should be small (10-20), definitely not hundreds.
        expect(stepsRun).to.be.lessThan(25); 
        expect(stepsRun).to.be.greaterThan(5);
    });
});
