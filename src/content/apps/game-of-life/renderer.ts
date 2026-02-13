/**
 * Game of Life — Canvas Renderer
 *
 * Renders the grid onto an HTML canvas element.
 * Reads theme-aware colors from CSS custom properties so the grid
 * adapts seamlessly to light/dark mode switches.
 */

import type { Grid } from "./simulation";

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  grid: Grid;
}

export interface Renderer {
  /** Full redraw of the entire grid. */
  draw(): void;
  /** Convert canvas pixel coordinates to grid cell coordinates. */
  canvasToCell(clientX: number, clientY: number): { x: number; y: number };
  /** Get current cell size in pixels. */
  getCellSize(): number;
  /** Resize the canvas to fill its container. */
  resize(): void;
}

/**
 * Read a CSS custom property value from the document root.
 */
function getCSSColor(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

/**
 * Create a renderer for the given canvas and grid.
 */
export function createRenderer(options: RendererOptions): Renderer {
  const { canvas, grid } = options;
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) throw new Error("Canvas 2D context not available");
  const ctx: CanvasRenderingContext2D = maybeCtx;
  let cellSize = 0;
  let offsetX = 0;
  let offsetY = 0;

  function resize(): void {
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Calculate cell size to fit the grid within the canvas
    const maxCellW = rect.width / grid.width;
    const maxCellH = rect.height / grid.height;
    cellSize = Math.floor(Math.min(maxCellW, maxCellH));
    if (cellSize < 1) cellSize = 1;

    // Center the grid
    offsetX = Math.floor((rect.width - cellSize * grid.width) / 2);
    offsetY = Math.floor((rect.height - cellSize * grid.height) / 2);
  }

  function draw(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const bgColor = getCSSColor("--color-bg");
    const cellColor = getCSSColor("--color-primary");
    const gridColor = getCSSColor("--color-border");

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Draw alive cells
    ctx.fillStyle = cellColor;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.cells[y * grid.width + x]) {
          ctx.fillRect(
            offsetX + x * cellSize + 1,
            offsetY + y * cellSize + 1,
            cellSize - 1,
            cellSize - 1,
          );
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Vertical lines
    for (let x = 0; x <= grid.width; x++) {
      const px = offsetX + x * cellSize;
      ctx.moveTo(px + 0.5, offsetY);
      ctx.lineTo(px + 0.5, offsetY + grid.height * cellSize);
    }

    // Horizontal lines
    for (let y = 0; y <= grid.height; y++) {
      const py = offsetY + y * cellSize;
      ctx.moveTo(offsetX, py + 0.5);
      ctx.lineTo(offsetX + grid.width * cellSize, py + 0.5);
    }

    ctx.stroke();
  }

  function canvasToCell(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left - offsetX;
    const py = clientY - rect.top - offsetY;
    return {
      x: Math.floor(px / cellSize),
      y: Math.floor(py / cellSize),
    };
  }

  function getCellSize(): number {
    return cellSize;
  }

  // Initial sizing
  resize();

  return { draw, canvasToCell, getCellSize, resize };
}
