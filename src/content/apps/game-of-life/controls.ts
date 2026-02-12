/**
 * Game of Life — UI Controls
 *
 * Handles mouse/touch interaction for drawing on the grid,
 * and wires up control buttons (play/pause, step, clear, randomize, speed).
 * All event listeners use AbortSignal for proper cleanup.
 */

import type { Renderer } from "./renderer";
import type { Grid } from "./simulation";
import { setCell, toggleCell } from "./simulation";

export interface ControlsOptions {
  canvas: HTMLCanvasElement;
  grid: Grid;
  renderer: Renderer;
  signal: AbortSignal;
  onDraw: () => void;
}

/**
 * Attach mouse and touch handlers for drawing on the canvas grid.
 *
 * - Click: toggle a cell
 * - Click + drag: paint cells alive
 * - Right-click + drag: erase cells
 * - Touch: paint cells alive
 */
export function attachDrawControls(options: ControlsOptions): void {
  const { canvas, grid, renderer, signal, onDraw } = options;

  let isDrawing = false;
  let drawValue = true; // true = paint alive, false = erase
  let lastCellX = -1;
  let lastCellY = -1;

  function handleCellInteraction(clientX: number, clientY: number, isStart: boolean): void {
    const { x, y } = renderer.canvasToCell(clientX, clientY);

    // Out of bounds check
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return;

    // Skip if same cell as last interaction (avoid re-toggling during drag)
    if (!isStart && x === lastCellX && y === lastCellY) return;
    lastCellX = x;
    lastCellY = y;

    if (isStart) {
      // On first click, toggle and remember the drawn value
      toggleCell(grid, x, y);
      drawValue = grid.cells[y * grid.width + x] === 1;
    } else {
      // During drag, paint with the initial draw value
      setCell(grid, x, y, drawValue);
    }

    onDraw();
  }

  // --- Mouse events ---

  canvas.addEventListener(
    "mousedown",
    (e: MouseEvent) => {
      if (e.button === 2) {
        // Right-click: erase mode
        isDrawing = true;
        drawValue = false;
        const { x, y } = renderer.canvasToCell(e.clientX, e.clientY);
        if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
          setCell(grid, x, y, false);
          lastCellX = x;
          lastCellY = y;
          onDraw();
        }
      } else if (e.button === 0) {
        isDrawing = true;
        handleCellInteraction(e.clientX, e.clientY, true);
      }
    },
    { signal },
  );

  canvas.addEventListener(
    "mousemove",
    (e: MouseEvent) => {
      if (!isDrawing) return;
      if (drawValue === false) {
        // Erase mode during right-drag
        const { x, y } = renderer.canvasToCell(e.clientX, e.clientY);
        if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
          if (x !== lastCellX || y !== lastCellY) {
            setCell(grid, x, y, false);
            lastCellX = x;
            lastCellY = y;
            onDraw();
          }
        }
      } else {
        handleCellInteraction(e.clientX, e.clientY, false);
      }
    },
    { signal },
  );

  window.addEventListener(
    "mouseup",
    () => {
      isDrawing = false;
      lastCellX = -1;
      lastCellY = -1;
    },
    { signal },
  );

  // Prevent context menu on canvas
  canvas.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });

  // --- Touch events ---

  canvas.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      isDrawing = true;
      handleCellInteraction(touch.clientX, touch.clientY, true);
    },
    { signal, passive: false },
  );

  canvas.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const touch = e.touches[0];
      handleCellInteraction(touch.clientX, touch.clientY, false);
    },
    { signal, passive: false },
  );

  canvas.addEventListener(
    "touchend",
    () => {
      isDrawing = false;
      lastCellX = -1;
      lastCellY = -1;
    },
    { signal },
  );
}
