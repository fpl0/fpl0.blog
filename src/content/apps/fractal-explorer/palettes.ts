/**
 * Color palettes for the fractal explorer.
 *
 * Each palette is an array of [r, g, b] stops. The renderer interpolates
 * between stops based on the normalized iteration count.
 *
 * Two variants per palette (light / dark) adjust luminance so fractals
 * remain readable on both themes.
 */

export interface Palette {
  name: string;
  light: [number, number, number][];
  dark: [number, number, number][];
}

/**
 * Antiquarian -- warm amber tones derived from the site's master hue.
 */
const antiquarian: Palette = {
  name: "Antiquarian",
  light: [
    [60, 30, 15],
    [140, 70, 30],
    [200, 140, 60],
    [240, 210, 140],
    [250, 240, 220],
    [200, 140, 60],
    [140, 70, 30],
  ],
  dark: [
    [15, 8, 4],
    [80, 40, 18],
    [160, 100, 40],
    [220, 180, 100],
    [240, 230, 200],
    [160, 100, 40],
    [80, 40, 18],
  ],
};

/**
 * Ocean -- deep blues and teals.
 */
const ocean: Palette = {
  name: "Ocean",
  light: [
    [10, 20, 50],
    [20, 60, 120],
    [40, 120, 180],
    [100, 200, 220],
    [220, 245, 250],
    [40, 120, 180],
    [20, 60, 120],
  ],
  dark: [
    [4, 8, 20],
    [10, 35, 80],
    [25, 80, 140],
    [60, 160, 200],
    [180, 230, 240],
    [25, 80, 140],
    [10, 35, 80],
  ],
};

/**
 * Ember -- fiery reds and oranges.
 */
const ember: Palette = {
  name: "Ember",
  light: [
    [50, 10, 10],
    [140, 30, 15],
    [210, 80, 20],
    [250, 170, 50],
    [255, 240, 180],
    [210, 80, 20],
    [140, 30, 15],
  ],
  dark: [
    [25, 5, 5],
    [100, 20, 10],
    [180, 60, 15],
    [230, 140, 35],
    [250, 220, 140],
    [180, 60, 15],
    [100, 20, 10],
  ],
};

/**
 * Moss -- earthy greens.
 */
const moss: Palette = {
  name: "Moss",
  light: [
    [15, 35, 15],
    [30, 80, 40],
    [60, 140, 70],
    [140, 200, 120],
    [220, 240, 210],
    [60, 140, 70],
    [30, 80, 40],
  ],
  dark: [
    [6, 15, 6],
    [18, 55, 25],
    [40, 110, 50],
    [100, 170, 90],
    [190, 225, 175],
    [40, 110, 50],
    [18, 55, 25],
  ],
};

export const palettes: Palette[] = [antiquarian, ocean, ember, moss];

/**
 * Build a 256x1 RGBA buffer from a palette's color stops.
 * Uploaded directly as a WebGL texture for hardware-interpolated lookup.
 */
export function buildPaletteData(palette: Palette, theme: "light" | "dark"): Uint8Array {
  const stops = theme === "dark" ? palette.dark : palette.light;
  const data = new Uint8Array(256 * 4);
  const segments = stops.length - 1;

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const seg = Math.min(Math.floor(t * segments), segments - 1);
    const local = t * segments - seg;
    const a = stops[seg] as [number, number, number];
    const b = stops[seg + 1] as [number, number, number];

    const off = i * 4;
    data[off] = Math.round(a[0] + (b[0] - a[0]) * local);
    data[off + 1] = Math.round(a[1] + (b[1] - a[1]) * local);
    data[off + 2] = Math.round(a[2] + (b[2] - a[2]) * local);
    data[off + 3] = 255;
  }

  return data;
}
