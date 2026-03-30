import { getScenario } from '../../js/core/scenarios.js';
import { isCollision } from '../../js/utils/collision.js';

const expect = window.chai.expect;

describe('Scenario Refinement (Complex Maze)', () => {
    it('should define a smaller robot radius for the maze', () => {
        const scenario = getScenario('complex_maze');
        expect(scenario.robotRadius).to.be.a('number');
        expect(scenario.robotRadius).to.be.lessThan(0.5); // Default is usually 0.5, maze needs smaller
    });

    it('should ensure start and goal are collision-free', () => {
        // Generate a few times to ensure stability
        for (let i = 0; i < 5; i++) {
            const scenario = getScenario('complex_maze');
            const startShape = { type: 'circle', x: scenario.start.x, y: scenario.start.y, radius: scenario.robotRadius || 0.1 };
            
            // Check start against all obstacles
            let startCollision = false;
            for (const obs of scenario.obstacles) {
                if (isCollision(startShape, obs)) {
                    startCollision = true;
                    break;
                }
            }
            expect(startCollision, 'Start position should be free').to.be.false;

            // Check goal(s)
            // Note: Goal regions are usually safe by definition, but we want to ensure 
            // they aren't generated ON TOP of a wall block.
            let goalCollision = false;
            const goalShape = scenario.goals[0]; // Assuming circle goal
            for (const obs of scenario.obstacles) {
                if (isCollision(goalShape, obs)) {
                    goalCollision = true;
                    break;
                }
            }
            expect(goalCollision, 'Goal position should be free').to.be.false;
        }
    });
});
