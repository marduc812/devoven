// All functions are pure (no React, no browser APIs).

// ─── Internal hex↔rgb helpers (self-contained, no Utils import) ──────────────

function hexToRgbLocal(hex: string): { r: number; g: number; b: number } {
  // Expand shorthand #RGB to #RRGGBB
  hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHexLocal(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const h = Math.round(Math.min(255, Math.max(0, x))).toString(16).toUpperCase();
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

// ─── Internal rgb↔hsl math ────────────────────────────────────────────────────

function rgbChannelsToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslChannelsToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// ─── Internal rgb string parsers ──────────────────────────────────────────────

function parseRgbString(rgb: string): { r: number; g: number; b: number } {
  // Accept "rgb(255, 128, 0)" or "255,128,0" or "255, 128, 0"
  const stripped = rgb.replace(/rgb\(|\)/gi, '');
  const parts = stripped.split(',').map(p => parseFloat(p.trim()));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid RGB: ${rgb}`);
  }
  return { r: parts[0], g: parts[1], b: parts[2] };
}

function parseHslString(hsl: string): { h: number; s: number; l: number } {
  // Accept "hsl(30, 100%, 50%)" or "30,100,50" or "30, 100, 50"
  const stripped = hsl.replace(/hsl\(|\)/gi, '').replace(/%/g, '');
  const parts = stripped.split(',').map(p => parseFloat(p.trim()));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid HSL: ${hsl}`);
  }
  return { h: parts[0], s: parts[1], l: parts[2] };
}

// ─── Internal rgb↔hsv math ────────────────────────────────────────────────────

function rgbChannelsToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }

  // Use 1 decimal place precision to preserve enough info for round-trips
  return {
    h: Math.round(h * 10) / 10,
    s: Math.round(s * 1000) / 10,
    v: Math.round(v * 1000) / 10,
  };
}

function hsvChannelsToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function parseHsvString(hsv: string): { h: number; s: number; v: number } {
  const stripped = hsv.replace(/hsv\(|\)/gi, '').replace(/%/g, '');
  const parts = stripped.split(',').map(p => parseFloat(p.trim()));
  if (parts.length !== 3 || parts.some(isNaN)) throw new Error(`Invalid HSV: ${hsv}`);
  return { h: parts[0], s: parts[1], v: parts[2] };
}

// ─── Channel-level entry points ──────────────────────────────────────────────
// The Blocks builder collects H, S and L as separate fields, so it needs the
// maths without the string parsing.

export function hslChannelsToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslChannelsToRgb(h, s, l);
  return rgbToHexLocal(r, g, b);
}

export function hslChannelsToRgbString(h: number, s: number, l: number): string {
  const { r, g, b } = hslChannelsToRgb(h, s, l);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hsvChannelsToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvChannelsToRgb(h, s, v);
  return rgbToHexLocal(r, g, b);
}

// ─── HEX ↔ HSL ───────────────────────────────────────────────────────────────

export function hexToHsl(hex: string): string {
  if (!hex.trim()) return '';
  const { r, g, b } = hexToRgbLocal(hex);
  const { h, s, l } = rgbChannelsToHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hslToHex(hsl: string): string {
  if (!hsl.trim()) return '';
  // Accept "hsl(H, S%, L%)" or "H, S, L" or "H,S,L"
  const stripped = hsl.replace(/hsl\(|\)/gi, '').replace(/%/g, '');
  const parts = stripped.split(',').map(p => parseFloat(p.trim()));
  if (parts.length !== 3 || parts.some(isNaN)) throw new Error(`Invalid HSL: ${hsl}`);
  const [h, s, l] = parts;
  const { r, g, b } = hslChannelsToRgb(h, s, l);
  return rgbToHexLocal(r, g, b);
}

// ─── RGB ↔ HSL ───────────────────────────────────────────────────────────────

export function rgbToHsl(rgb: string): string {
  if (!rgb.trim()) return '';
  const { r, g, b } = parseRgbString(rgb);
  const { h, s, l } = rgbChannelsToHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hslToRgb(hsl: string): string {
  if (!hsl.trim()) return '';
  const { h, s, l } = parseHslString(hsl);
  const { r, g, b } = hslChannelsToRgb(h, s, l);
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── HEX ↔ HSV ───────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r === Math.floor(r) ? String(Math.floor(r)) : r.toFixed(1);
}

export function hexToHsv(hex: string): string {
  if (!hex.trim()) return '';
  const { r, g, b } = hexToRgbLocal(hex);
  const { h, s, v } = rgbChannelsToHsv(r, g, b);
  return `hsv(${fmtNum(h)}, ${fmtNum(s)}%, ${fmtNum(v)}%)`;
}

export function hsvToHex(hsv: string): string {
  if (!hsv.trim()) return '';
  const { h, s, v } = parseHsvString(hsv);
  const { r, g, b } = hsvChannelsToRgb(h, s, v);
  return rgbToHexLocal(r, g, b);
}

// ─── CSS Named Color Lookup Table ─────────────────────────────────────────────
// Source: CSS Color Level 4 (https://www.w3.org/TR/css-color-4/#named-colors)
// 148 named colors — all standard CSS named colors included.

const CSS_NAMED_COLORS: Record<string, string> = {
  aliceblue: '#F0F8FF',
  antiquewhite: '#FAEBD7',
  aqua: '#00FFFF',
  aquamarine: '#7FFFD4',
  azure: '#F0FFFF',
  beige: '#F5F5DC',
  bisque: '#FFE4C4',
  black: '#000000',
  blanchedalmond: '#FFEBCD',
  blue: '#0000FF',
  blueviolet: '#8A2BE2',
  brown: '#A52A2A',
  burlywood: '#DEB887',
  cadetblue: '#5F9EA0',
  chartreuse: '#7FFF00',
  chocolate: '#D2691E',
  coral: '#FF7F50',
  cornflowerblue: '#6495ED',
  cornsilk: '#FFF8DC',
  crimson: '#DC143C',
  cyan: '#00FFFF',
  darkblue: '#00008B',
  darkcyan: '#008B8B',
  darkgoldenrod: '#B8860B',
  darkgray: '#A9A9A9',
  darkgreen: '#006400',
  darkgrey: '#A9A9A9',
  darkkhaki: '#BDB76B',
  darkmagenta: '#8B008B',
  darkolivegreen: '#556B2F',
  darkorange: '#FF8C00',
  darkorchid: '#9932CC',
  darkred: '#8B0000',
  darksalmon: '#E9967A',
  darkseagreen: '#8FBC8F',
  darkslateblue: '#483D8B',
  darkslategray: '#2F4F4F',
  darkslategrey: '#2F4F4F',
  darkturquoise: '#00CED1',
  darkviolet: '#9400D3',
  deeppink: '#FF1493',
  deepskyblue: '#00BFFF',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1E90FF',
  firebrick: '#B22222',
  floralwhite: '#FFFAF0',
  forestgreen: '#228B22',
  fuchsia: '#FF00FF',
  gainsboro: '#DCDCDC',
  ghostwhite: '#F8F8FF',
  gold: '#FFD700',
  goldenrod: '#DAA520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#ADFF2F',
  grey: '#808080',
  honeydew: '#F0FFF0',
  hotpink: '#FF69B4',
  indianred: '#CD5C5C',
  indigo: '#4B0082',
  ivory: '#FFFFF0',
  khaki: '#F0E68C',
  lavender: '#E6E6FA',
  lavenderblush: '#FFF0F5',
  lawngreen: '#7CFC00',
  lemonchiffon: '#FFFACD',
  lightblue: '#ADD8E6',
  lightcoral: '#F08080',
  lightcyan: '#E0FFFF',
  lightgoldenrodyellow: '#FAFAD2',
  lightgray: '#D3D3D3',
  lightgreen: '#90EE90',
  lightgrey: '#D3D3D3',
  lightpink: '#FFB6C1',
  lightsalmon: '#FFA07A',
  lightseagreen: '#20B2AA',
  lightskyblue: '#87CEFA',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#B0C4DE',
  lightyellow: '#FFFFE0',
  lime: '#00FF00',
  limegreen: '#32CD32',
  linen: '#FAF0E6',
  magenta: '#FF00FF',
  maroon: '#800000',
  mediumaquamarine: '#66CDAA',
  mediumblue: '#0000CD',
  mediumorchid: '#BA55D3',
  mediumpurple: '#9370DB',
  mediumseagreen: '#3CB371',
  mediumslateblue: '#7B68EE',
  mediumspringgreen: '#00FA9A',
  mediumturquoise: '#48D1CC',
  mediumvioletred: '#C71585',
  midnightblue: '#191970',
  mintcream: '#F5FFFA',
  mistyrose: '#FFE4E1',
  moccasin: '#FFE4B5',
  navajowhite: '#FFDEAD',
  navy: '#000080',
  oldlace: '#FDF5E6',
  olive: '#808000',
  olivedrab: '#6B8E23',
  orange: '#FFA500',
  orangered: '#FF4500',
  orchid: '#DA70D6',
  palegoldenrod: '#EEE8AA',
  palegreen: '#98FB98',
  paleturquoise: '#AFEEEE',
  palevioletred: '#DB7093',
  papayawhip: '#FFEFD5',
  peachpuff: '#FFDAB9',
  peru: '#CD853F',
  pink: '#FFC0CB',
  plum: '#DDA0DD',
  powderblue: '#B0E0E6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#FF0000',
  rosybrown: '#BC8F8F',
  royalblue: '#4169E1',
  saddlebrown: '#8B4513',
  salmon: '#FA8072',
  sandybrown: '#F4A460',
  seagreen: '#2E8B57',
  seashell: '#FFF5EE',
  sienna: '#A0522D',
  silver: '#C0C0C0',
  skyblue: '#87CEEB',
  slateblue: '#6A5ACD',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#FFFAFA',
  springgreen: '#00FF7F',
  steelblue: '#4682B4',
  tan: '#D2B48C',
  teal: '#008080',
  thistle: '#D8BFD8',
  tomato: '#FF6347',
  turquoise: '#40E0D0',
  violet: '#EE82EE',
  wheat: '#F5DEB3',
  white: '#FFFFFF',
  whitesmoke: '#F5F5F5',
  yellow: '#FFFF00',
  yellowgreen: '#9ACD32',
};

// Reverse lookup: hex → name (built once at module load)
const HEX_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(CSS_NAMED_COLORS).map(([name, hex]) => [hex.toUpperCase(), name]),
);

// ─── Color Name ↔ HEX ────────────────────────────────────────────────────────

export function colorNameToHex(name: string): string {
  if (!name.trim()) return '';
  const key = name.trim().toLowerCase();
  const hex = CSS_NAMED_COLORS[key];
  if (!hex) throw new Error(`Unknown CSS color name: "${name}"`);
  return hex;
}

export function hexToColorName(hex: string): string {
  if (!hex.trim()) return '';
  // Normalise to uppercase 6-digit hex with #
  const normalised = hex.trim().replace(
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
    (_, r, g, b) => r + r + g + g + b + b,
  ).toUpperCase();
  const withHash = normalised.startsWith('#') ? normalised : '#' + normalised;
  const name = HEX_TO_NAME[withHash];
  if (!name) throw new Error(`No CSS named color matches "${hex}"`);
  return name;
}

// ─── Gradient Generator ───────────────────────────────────────────────────────

export function generateLinearGradientCss(
  color1: string,
  color2: string,
  direction: string,
): string {
  return `linear-gradient(${direction}, ${color1}, ${color2})`;
}

// ─── Color Palette Extractor helpers ─────────────────────────────────────────

/**
 * Rounds each RGB channel to the nearest `step` multiple, clamps to 0–255,
 * and returns a hex string. Used to bucket similar colors together.
 */
export function quantizeColor(r: number, g: number, b: number, step: number): string {
  const quantize = (v: number) => Math.min(255, Math.round(v / step) * step);
  return rgbToHexLocal(quantize(r), quantize(g), quantize(b));
}

/**
 * Given a Map of hex color → pixel count, returns the top `count` colors
 * sorted by frequency descending.
 */
export function getTopColors(colorCounts: Map<string, number>, count: number): string[] {
  return [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([color]) => color);
}
