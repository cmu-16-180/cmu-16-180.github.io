import { getScenario } from '../../js/core/scenarios.js';

const expect = window.chai.expect;

describe('Scenario Loader', () => {
    it('should return a default scenario for unknown keys', () => {
        const scenario = getScenario('invalid_key');
        expect(scenario).to.exist;
        expect(scenario.obstacles).to.be.an('array');
    });

    it('should generate a complex maze with obstacles', () => {
        const scenario = getScenario('complex_maze');
        
        expect(scenario).to.exist;
        expect(scenario.obstacles).to.be.an('array');
        
        // A 10x10 maze should have a significant number of wall segments
        expect(scenario.obstacles.length).to.be.greaterThan(10);
        
        // Check structure of generated obstacles
        const wall = scenario.obstacles[0];
        expect(wall.type).to.equal('polygon');
        expect(wall.points).to.have.lengthOf(4); // Rectangles defined as polygons
    });

    it('should provide valid start and goal configurations', () => {
        const scenario = getScenario('complex_maze');
        expect(scenario.start).to.have.property('x');
        expect(scenario.start).to.have.property('y');
        expect(scenario.goals).to.be.an('array');
        expect(scenario.goals.length).to.be.greaterThan(0);
    });
});
