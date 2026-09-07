// Pure logic for the pixel-editing image tools: Image Adjustments, Invert
// Colors and Flip Image. No React, no canvas, no DOM — the canvas glue lives in
// index.tsx and calls into here for every decision it makes.

// ─── Output format ────────────────────────────────────────────────────────────

/** The three formats a browser canvas can actually encode. */
export type OutputFormat = 'png' | 'jpeg' | 'webp';

export const mimeFor: Record<OutputFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export const extensionFor: Record<OutputFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
};

/** Encoding quality for the lossy formats. Ignored for PNG. */
export const OUTPUT_QUALITY = 0.92;

/**
 * A canvas re-encodes whatever it drew, so the output format is a choice these
 * tools have to make. Keep the format the user dropped where the canvas can
 * write it, and fall back to PNG — lossless, universally supported — for
 * everything else (GIF, BMP, AVIF, SVG, HEIC).
 */
export function outputFormatFor(mime: string): OutputFormat {
  switch (mime.toLowerCase().split(';')[0].trim()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpeg';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

/**
 * `beach.jpg` + `adjusted` → `beach-adjusted.jpg`. The extension follows the
 * format actually written, not the one that came in, so a GIF turns into
 * `cat-inverted.png` rather than a PNG wearing a `.gif` name.
 */
export function editedName(name: string, suffix: string, format: OutputFormat): string {
  const stem = name.replace(/\.[^./\\]+$/, '') || 'image';
  return `${stem}-${suffix}.${extensionFor[format]}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Decoding happens on the main thread, and a canvas holds four bytes per pixel
 * whatever the file compressed to, so the ceiling here is lower than the 100 MB
 * the metadata tools allow — those never decode anything.
 */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

// ─── Slider values ────────────────────────────────────────────────────────────

/**
 * Every slider on these three tools is a percentage. 100 means "as it came in"
 * for the adjustments; 0–200 is the range the CSS filter functions stay useful
 * over — past 200% brightness almost everything is white.
 */
export const MIN_PERCENT = 0;
export const MAX_PERCENT = 200;

export function clampPercent(value: number, max: number = MAX_PERCENT): number {
  if (!Number.isFinite(value)) return 100;
  return Math.round(Math.max(MIN_PERCENT, Math.min(max, value)));
}

/** `110` → `1.1`, `100` → `1`, `105` → `1.05`. Filter functions take a ratio. */
export function ratio(percent: number): string {
  const value = percent / 100;
  return String(Number(value.toFixed(4)));
}

// ─── Image Adjustments ────────────────────────────────────────────────────────

export type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
};

export const NEUTRAL: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };

export function isNeutral(a: Adjustments): boolean {
  return a.brightness === 100 && a.contrast === 100 && a.saturation === 100;
}

/**
 * The canvas `filter` string. Terms that are at 100% are left out, so a
 * brightness-only edit reads as `brightness(1.2)` rather than three functions
 * two of which do nothing. Returns `''` when there is nothing to apply, which
 * the caller reads as "copy the pixels straight through".
 */
export function buildFilter(a: Adjustments): string {
  const terms: string[] = [];
  if (a.brightness !== 100) terms.push(`brightness(${ratio(a.brightness)})`);
  if (a.contrast !== 100) terms.push(`contrast(${ratio(a.contrast)})`);
  if (a.saturation !== 100) terms.push(`saturate(${ratio(a.saturation)})`);
  return terms.join(' ');
}

const signed = (percent: number): string => `${percent > 100 ? '+' : ''}${percent - 100}%`;

/** The line under the result: `brightness +10% · saturation -25%`. */
export function describeAdjustments(a: Adjustments): string {
  if (isNeutral(a)) return 'unchanged';
  const parts: string[] = [];
  if (a.brightness !== 100) parts.push(`brightness ${signed(a.brightness)}`);
  if (a.contrast !== 100) parts.push(`contrast ${signed(a.contrast)}`);
  if (a.saturation !== 100) parts.push(`saturation ${signed(a.saturation)}`);
  return parts.join(' · ');
}

const readPercent = (raw: string | null, fallback: number, max?: number): number => {
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? clampPercent(value, max) : fallback;
};

/** Reads `?brightness=110&contrast=95&saturation=120`, ignoring junk. */
export function parseAdjustments(params: URLSearchParams): Adjustments {
  return {
    brightness: readPercent(params.get('brightness'), 100),
    contrast: readPercent(params.get('contrast'), 100),
    saturation: readPercent(params.get('saturation'), 100),
  };
}

// ─── Invert ───────────────────────────────────────────────────────────────────

/** Full inversion is the point of the tool, so that is where the slider starts. */
export const INVERT_DEFAULT = 100;
export const INVERT_MAX = 100;

/**
 * `invert(0.5)` is the midpoint where every channel lands on grey, so anything
 * below 50% is a wash rather than an inversion — worth having, but the amount
 * is the only thing there is to say about the result.
 */
export function buildInvertFilter(amount: number): string {
  const clamped = clampPercent(amount, INVERT_MAX);
  return clamped === 0 ? '' : `invert(${ratio(clamped)})`;
}

export function describeInvert(amount: number): string {
  const clamped = clampPercent(amount, INVERT_MAX);
  if (clamped === 0) return 'unchanged';
  if (clamped === 100) return 'fully inverted';
  return `${clamped}% inverted`;
}

export function parseInvertAmount(params: URLSearchParams): number {
  return readPercent(params.get('amount'), INVERT_DEFAULT, INVERT_MAX);
}

// ─── Flip ─────────────────────────────────────────────────────────────────────

export type FlipAxes = {
  horizontal: boolean;
  vertical: boolean;
};

export const FLIP_DEFAULT: FlipAxes = { horizontal: true, vertical: false };

/**
 * What to hand `ctx.scale` before drawing. Flipping both axes is the same
 * picture as a 180° rotation, which is fine — a user who thinks in mirrors
 * should not have to think in degrees to get there.
 */
export function flipTransform(axes: FlipAxes): { scaleX: number; scaleY: number } {
  return {
    scaleX: axes.horizontal ? -1 : 1,
    scaleY: axes.vertical ? -1 : 1,
  };
}

export function describeFlip(axes: FlipAxes): string {
  if (axes.horizontal && axes.vertical) return 'flipped both ways';
  if (axes.horizontal) return 'flipped left to right';
  if (axes.vertical) return 'flipped top to bottom';
  return 'unchanged';
}

export function parseFlipAxes(params: URLSearchParams): FlipAxes {
  const axis = params.get('axis');
  if (axis === null) return { ...FLIP_DEFAULT };
  const value = axis.toLowerCase();
  return {
    horizontal: value === 'h' || value === 'both' || value === 'horizontal',
    vertical: value === 'v' || value === 'both' || value === 'vertical',
  };
}

/** The mirror of `parseFlipAxes`, for the share link. */
export function serializeFlipAxes(axes: FlipAxes): string {
  if (axes.horizontal && axes.vertical) return 'both';
  if (axes.horizontal) return 'h';
  if (axes.vertical) return 'v';
  return 'none';
}
