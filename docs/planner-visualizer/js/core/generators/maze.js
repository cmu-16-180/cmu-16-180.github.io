import { WORKSPACE_SIZE } from '../../utils/geometry.js';

/**
 * Generates a random maze with thin walls using Recursive Backtracker.
 * Returns obstacles as thin polygons placed between grid cells.
 */
export function generateMazeObstacles() {
    const cols = 10;
    const rows = 10;
    const cellSize = WORKSPACE_SIZE / cols; // 1.0m
    const wallThickness = 0.1; // 0.1m thin walls

    const vWalls = Array(rows).fill().map(() => Array(cols - 1).fill(true));
    const hWalls = Array(rows - 1).fill().map(() => Array(cols).fill(true));
    const visited = Array(rows).fill().map(() => Array(cols).fill(false));

    // Recursive Backtracker DFS
    const stack = [{r: 0, c: 0}];
    visited[0][0] = true;

    while (stack.length > 0) {
        const curr = stack[stack.length - 1];
        const neighbors = [];

        if (curr.r < rows - 1 && !visited[curr.r + 1][curr.c]) neighbors.push({r: curr.r + 1, c: curr.c, dir: 'U'});
        if (curr.r > 0 && !visited[curr.r - 1][curr.c]) neighbors.push({r: curr.r - 1, c: curr.c, dir: 'D'});
        if (curr.c < cols - 1 && !visited[curr.r][curr.c + 1]) neighbors.push({r: curr.r, c: curr.c + 1, dir: 'R'});
        if (curr.c > 0 && !visited[curr.r][curr.c - 1]) neighbors.push({r: curr.r, c: curr.c - 1, dir: 'L'});

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            if (next.dir === 'U') hWalls[curr.r][curr.c] = false;
            else if (next.dir === 'D') hWalls[next.r][next.c] = false;
            else if (next.dir === 'R') vWalls[curr.r][curr.c] = false;
            else if (next.dir === 'L') vWalls[next.r][next.c] = false;

            visited[next.r][next.c] = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }

    const obstacles = [];
    const halfThick = wallThickness / 2;

    // Convert Vertical Walls
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
            if (vWalls[r][c]) {
                const cx = (c + 1) * cellSize;
                const yBottom = r * cellSize - halfThick;
                const yTop = (r + 1) * cellSize + halfThick;
                
                obstacles.push({
                    type: 'polygon',
                    points: [
                        { x: cx - halfThick, y: yBottom },
                        { x: cx + halfThick, y: yBottom },
                        { x: cx + halfThick, y: yTop },
                        { x: cx - halfThick, y: yTop }
                    ]
                });
            }
        }
    }

    // Convert Horizontal Walls
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
            if (hWalls[r][c]) {
                const cy = (r + 1) * cellSize;
                const xLeft = c * cellSize - halfThick;
                const xRight = (c + 1) * cellSize + halfThick;

                obstacles.push({
                    type: 'polygon',
                    points: [
                        { x: xLeft, y: cy - halfThick },
                        { x: xRight, y: cy - halfThick },
                        { x: xRight, y: cy + halfThick },
                        { x: xLeft, y: cy + halfThick }
                    ]
                });
            }
        }
    }

    return obstacles;
}
