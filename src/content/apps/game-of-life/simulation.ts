/**
 * Game of Life — Core Simulation
 *
 * Uses a flat Uint8Array for the grid (0 = dead, 1 = alive).
 * Toroidal wrapping: edges connect to the opposite side.
 * Standard B3/S23 rules (Born with 3 neighbors, Survive with 2 or 3).
 */

export interface Grid {
  readonly width: number;
  readonly height: number;
  cells: Uint8Array;
}

/**
 * Create a new empty grid.
 */
export function createGrid(width: number, height: number): Grid {
  return {
    width,
    height,
    cells: new Uint8Array(width * height),
  };
}

/**
 * Get the index into the flat array for a given (x, y) coordinate.
 */
function index(grid: Grid, x: number, y: number): number {
  return y * grid.width + x;
}

/**
 * Get cell state at (x, y) with toroidal wrapping.
 */
export function getCell(grid: Grid, x: number, y: number): number {
  const wx = ((x % grid.width) + grid.width) % grid.width;
  const wy = ((y % grid.height) + grid.height) % grid.height;
  return grid.cells[index(grid, wx, wy)];
}

/**
 * Set cell state at (x, y). No wrapping — assumes valid coordinates.
 */
export function setCell(grid: Grid, x: number, y: number, alive: boolean): void {
  if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
    grid.cells[index(grid, x, y)] = alive ? 1 : 0;
  }
}

/**
 * Toggle cell state at (x, y).
 */
export function toggleCell(grid: Grid, x: number, y: number): void {
  if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
    const i = index(grid, x, y);
    grid.cells[i] = grid.cells[i] ? 0 : 1;
  }
}

/**
 * Count live neighbors of cell at (x, y) with toroidal wrapping.
 */
function countNeighbors(grid: Grid, x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      count += getCell(grid, x + dx, y + dy);
    }
  }
  return count;
}

/**
 * Advance the simulation by one generation (B3/S23 rules).
 * Returns a new grid — does not mutate the input.
 */
export function step(grid: Grid): Grid {
  const next = createGrid(grid.width, grid.height);

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const neighbors = countNeighbors(grid, x, y);
      const alive = grid.cells[index(grid, x, y)];

      if (alive) {
        // Survive with 2 or 3 neighbors
        next.cells[index(next, x, y)] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        // Born with exactly 3 neighbors
        next.cells[index(next, x, y)] = neighbors === 3 ? 1 : 0;
      }
    }
  }

  return next;
}

/**
 * Clear all cells in the grid.
 */
export function clear(grid: Grid): void {
  grid.cells.fill(0);
}

/**
 * Randomize the grid with a given density (0.0 to 1.0).
 */
export function randomize(grid: Grid, density = 0.3): void {
  for (let i = 0; i < grid.cells.length; i++) {
    grid.cells[i] = Math.random() < density ? 1 : 0;
  }
}
