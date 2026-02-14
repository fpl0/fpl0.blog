export interface ExplorerEngineOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  getColor: (property: string) => string;
  isMobile: boolean;
  reducedMotion: boolean;
}

export interface ExplorerEngine {
  update(dt: number): void;
  draw(): void;
  resize(width: number, height: number): void;
  onThemeChange(): void;
  setReducedMotion(enabled: boolean): void;
}

export function createExplorerEngine(options: ExplorerEngineOptions): ExplorerEngine;
