/**
 * GPU-accelerated fractal renderer using WebGL2.
 *
 * The entire Mandelbrot/Julia iteration loop runs as a fragment shader,
 * computing all pixels in parallel on the GPU. Color palettes are
 * uploaded as 1D textures for hardware-interpolated lookup.
 *
 * One draw call per frame. No workers, no progressive rendering.
 * Includes an infinite auto-zoom mode that cycles through interesting
 * Mandelbrot boundary points with cross-fade transitions.
 */

import { buildPaletteData, type Palette, palettes } from "./palettes";

export type FractalType = "mandelbrot" | "julia";

export interface Viewport {
  centerX: number;
  centerY: number;
  zoom: number;
}

/* -------------------------------------------------------------------------- */
/*  Default constants                                                         */
/* -------------------------------------------------------------------------- */

const DEFAULT_VIEWPORT: Viewport = { centerX: -0.5, centerY: 0, zoom: 3.5 };
const DEFAULT_JULIA_REAL = -0.7;
const DEFAULT_JULIA_IMAG = 0.27015;
const DEFAULT_MAX_ITER = 200;

/** Multiply zoom by this factor each frame during auto-zoom (~0.5% per frame). */
const AUTO_ZOOM_SPEED = 0.995;
/** Below this zoom level, float32 precision degrades visibly. */
const PRECISION_LIMIT = 2e-6;
/** Alpha change per frame during cross-fade (~30 frames = 0.5s at 60fps). */
const FADE_STEP = 0.034;

/** Interesting points on the Mandelbrot set boundary for auto-zoom. */
const ZOOM_TARGETS = [
  { re: -0.7435669, im: 0.1314023 },
  { re: 0.36024, im: -0.641313 },
  { re: -0.0452407, im: 0.9868162 },
  { re: -1.25066, im: 0.02012 },
  { re: -0.745428, im: 0.113009 },
];

/* -------------------------------------------------------------------------- */
/*  GLSL shaders                                                              */
/* -------------------------------------------------------------------------- */

/** Fullscreen triangle via gl_VertexID -- no vertex buffer needed. */
const VERT_SRC = `#version 300 es
void main() {
  float x = -1.0 + float((gl_VertexID & 1) << 2);
  float y = -1.0 + float((gl_VertexID & 2) << 1);
  gl_Position = vec4(x, y, 0.0, 1.0);
}
`;

/**
 * Fractal iteration + smooth coloring + palette texture lookup.
 * The loop cap (2000) matches the iteration slider maximum.
 * u_alpha enables cross-fade transitions during auto-zoom.
 */
const FRAG_SRC = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIter;
uniform int u_type;
uniform vec2 u_julia;
uniform sampler2D u_pal;
uniform float u_alpha;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;

  /* Map pixel to complex plane (y flipped to match CSS top-down coords) */
  float re = u_center.x + (uv.x - 0.5) * u_zoom * aspect;
  float im = u_center.y - (uv.y - 0.5) * u_zoom;

  float zr, zi, cr, ci;
  if (u_type == 0) {
    /* Mandelbrot: z = 0, c = pixel */
    zr = 0.0; zi = 0.0; cr = re; ci = im;
  } else {
    /* Julia: z = pixel, c = seed */
    zr = re; zi = im; cr = u_julia.x; ci = u_julia.y;
  }

  int n = 0;
  float r2 = zr * zr;
  float i2 = zi * zi;

  for (int i = 0; i < 2000; i++) {
    if (i >= u_maxIter || r2 + i2 > 4.0) break;
    zi = 2.0 * zr * zi + ci;
    zr = r2 - i2 + cr;
    r2 = zr * zr;
    i2 = zi * zi;
    n++;
  }

  vec3 c;
  if (n >= u_maxIter) {
    /* Inside the set -- very dark brown, never pure black */
    c = vec3(0.039, 0.031, 0.024);
  } else {
    /* Smooth coloring: continuous iteration count -> palette lookup */
    float s = float(n) + 1.0 - log2(max(1.0, log2(r2 + i2)));
    c = texture(u_pal, vec2(fract(s / 256.0), 0.5)).rgb;
  }

  /* Premultiplied alpha for compositor blending during fade transitions */
  fragColor = vec4(c * u_alpha, u_alpha);
}
`;

/* -------------------------------------------------------------------------- */
/*  WebGL helpers                                                             */
/* -------------------------------------------------------------------------- */

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile: ${log}`);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  if (!prog) throw new Error("Failed to create program");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link: ${log}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function uniform(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const loc = gl.getUniformLocation(prog, name);
  if (loc === null) throw new Error(`Uniform ${name} not found`);
  return loc;
}

/* -------------------------------------------------------------------------- */
/*  FractalRenderer                                                           */
/* -------------------------------------------------------------------------- */

export class FractalRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private palTex: WebGLTexture;
  private canvas: HTMLCanvasElement;
  private dirty = false;
  private rafId = 0;
  private fadeAlpha = 1.0;

  private loc: {
    res: WebGLUniformLocation;
    center: WebGLUniformLocation;
    zoom: WebGLUniformLocation;
    maxIter: WebGLUniformLocation;
    type: WebGLUniformLocation;
    julia: WebGLUniformLocation;
    pal: WebGLUniformLocation;
    alpha: WebGLUniformLocation;
  };

  /* Auto-zoom state */
  private autoActive = false;
  private autoRafId = 0;
  private autoTargetIdx = 0;
  private autoFadingOut = false;

  /* Public state */
  viewport: Viewport = { ...DEFAULT_VIEWPORT };
  fractalType: FractalType = "mandelbrot";
  maxIter = DEFAULT_MAX_ITER;
  juliaReal = DEFAULT_JULIA_REAL;
  juliaImag = DEFAULT_JULIA_IMAG;
  palette: Palette = palettes[0] as Palette;
  theme: "light" | "dark" = "light";

  onViewportChange?: (v: Viewport) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;

    /* Compile shaders */
    this.program = linkProgram(gl, VERT_SRC, FRAG_SRC);

    this.loc = {
      res: uniform(gl, this.program, "u_res"),
      center: uniform(gl, this.program, "u_center"),
      zoom: uniform(gl, this.program, "u_zoom"),
      maxIter: uniform(gl, this.program, "u_maxIter"),
      type: uniform(gl, this.program, "u_type"),
      julia: uniform(gl, this.program, "u_julia"),
      pal: uniform(gl, this.program, "u_pal"),
      alpha: uniform(gl, this.program, "u_alpha"),
    };

    /* Empty VAO -- fullscreen triangle needs no vertex data */
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to create VAO");
    this.vao = vao;

    /* Palette texture (256x1 RGBA) */
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create texture");
    this.palTex = tex;
  }

  /* ---- Lifecycle ---- */

  init(): void {
    this.uploadPalette();
    this.resize();
    this.requestRender();
  }

  destroy(): void {
    this.stopAutoZoom();
    cancelAnimationFrame(this.rafId);
    this.gl.deleteTexture(this.palTex);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }

  /* ---- Palette texture ---- */

  private uploadPalette(): void {
    const data = buildPaletteData(this.palette, this.theme);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.palTex);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      256,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data,
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  /* ---- Rendering ---- */

  requestRender(): void {
    if (this.autoActive) return;
    if (!this.dirty) {
      this.dirty = true;
      this.rafId = requestAnimationFrame(() => this.draw());
    }
  }

  private draw(): void {
    this.dirty = false;

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vao);

    this.gl.uniform2f(this.loc.res, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.loc.center, this.viewport.centerX, this.viewport.centerY);
    this.gl.uniform1f(this.loc.zoom, this.viewport.zoom);
    this.gl.uniform1i(this.loc.maxIter, this.maxIter);
    this.gl.uniform1i(this.loc.type, this.fractalType === "mandelbrot" ? 0 : 1);
    this.gl.uniform2f(this.loc.julia, this.juliaReal, this.juliaImag);
    this.gl.uniform1f(this.loc.alpha, this.fadeAlpha);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.palTex);
    this.gl.uniform1i(this.loc.pal, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  /* ---- Canvas sizing ---- */

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  }

  /* ---- Auto-zoom ---- */

  startAutoZoom(): void {
    if (this.autoActive) return;
    this.autoActive = true;
    this.fractalType = "mandelbrot";
    this.fadeAlpha = 1.0;
    this.autoFadingOut = false;
    this.pickTarget();
    this.autoFrame();
  }

  stopAutoZoom(): void {
    if (!this.autoActive) return;
    this.autoActive = false;
    cancelAnimationFrame(this.autoRafId);
    this.fadeAlpha = 1.0;
    this.requestRender();
  }

  isAutoZooming(): boolean {
    return this.autoActive;
  }

  private pickTarget(): void {
    const t = ZOOM_TARGETS[
      this.autoTargetIdx % ZOOM_TARGETS.length
    ] as (typeof ZOOM_TARGETS)[number];
    this.viewport.centerX = t.re;
    this.viewport.centerY = t.im;
    this.viewport.zoom = DEFAULT_VIEWPORT.zoom;
    this.autoTargetIdx++;
  }

  private autoFrame(): void {
    if (!this.autoActive) return;

    /* Fade logic */
    if (this.autoFadingOut) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - FADE_STEP);
      if (this.fadeAlpha <= 0) {
        this.autoFadingOut = false;
        this.pickTarget();
      }
    } else if (this.fadeAlpha < 1.0) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + FADE_STEP);
    }

    /* Zoom deeper */
    this.viewport.zoom *= AUTO_ZOOM_SPEED;

    /* Trigger fade when approaching float32 precision limit */
    if (this.viewport.zoom < PRECISION_LIMIT && !this.autoFadingOut) {
      this.autoFadingOut = true;
    }

    this.onViewportChange?.(this.viewport);
    this.draw();
    this.autoRafId = requestAnimationFrame(() => this.autoFrame());
  }

  /* ---- Public mutators ---- */

  setTheme(theme: "light" | "dark"): void {
    this.theme = theme;
    this.uploadPalette();
    this.requestRender();
  }

  setPalette(palette: Palette): void {
    this.palette = palette;
    this.uploadPalette();
    this.requestRender();
  }

  setMaxIter(n: number): void {
    this.maxIter = n;
    this.requestRender();
  }

  setFractalType(type: FractalType): void {
    this.fractalType = type;
    if (type === "mandelbrot") {
      this.viewport = { ...DEFAULT_VIEWPORT };
    }
    this.onViewportChange?.(this.viewport);
    this.requestRender();
  }

  setJuliaSeed(re: number, im: number): void {
    this.juliaReal = re;
    this.juliaImag = im;
    if (this.fractalType === "julia") {
      this.requestRender();
    }
  }

  reset(): void {
    this.stopAutoZoom();
    this.viewport = { ...DEFAULT_VIEWPORT };
    this.fractalType = "mandelbrot";
    this.maxIter = DEFAULT_MAX_ITER;
    this.juliaReal = DEFAULT_JULIA_REAL;
    this.juliaImag = DEFAULT_JULIA_IMAG;
    this.onViewportChange?.(this.viewport);
    this.requestRender();
  }

  /* ---- Coordinate conversion ---- */

  canvasToComplex(clientX: number, clientY: number): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    const aspect = rect.width / rect.height;

    const re = this.viewport.centerX + (nx - 0.5) * this.viewport.zoom * aspect;
    const im = this.viewport.centerY + (ny - 0.5) * this.viewport.zoom;
    return [re, im];
  }

  zoomAt(clientX: number, clientY: number, factor: number): void {
    const [re, im] = this.canvasToComplex(clientX, clientY);
    const newZoom = this.viewport.zoom * factor;

    this.viewport.centerX = re - (re - this.viewport.centerX) * (newZoom / this.viewport.zoom);
    this.viewport.centerY = im - (im - this.viewport.centerY) * (newZoom / this.viewport.zoom);
    this.viewport.zoom = newZoom;

    this.onViewportChange?.(this.viewport);
    this.requestRender();
  }

  pan(dx: number, dy: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    this.viewport.centerX -= (dx / rect.width) * this.viewport.zoom * aspect;
    this.viewport.centerY -= (dy / rect.height) * this.viewport.zoom;
    this.onViewportChange?.(this.viewport);
    this.requestRender();
  }
}
