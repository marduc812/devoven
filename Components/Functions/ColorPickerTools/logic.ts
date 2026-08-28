// ─── Color Picker Helper ─────────────────────────────────────────────────────
// Pure math color conversions — no browser APIs

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type HSV = { h: number; s: number; v: number };
export type CMYK = { c: number; m: number; y: number; k: number };

export type ColorAnalysis = {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  hsv: HSV;
  cmyk: CMYK;
  complementary: string;
  shades: string[];
  tints: string[];
  cssVariable: string;
  tailwindHint: string;
};

// ─── Parsers ──────────────────────────────────────────────────────────────────

export function parseHex(hex: string): RGB {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error('Invalid hex color. Use format #RRGGBB or #RGB.');
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// ─── Converters ───────────────────────────────────────────────────────────────

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// ─── Shades & Tints ───────────────────────────────────────────────────────────

export function generateShades(hex: string, steps: number): string[] {
  const rgb = parseHex(hex);
  const hsl = rgbToHsl(rgb);
  const result: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const l = Math.max(0, hsl.l - i * Math.floor(hsl.l / (steps + 1)));
    result.push(rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l })));
  }
  return result;
}

export function generateTints(hex: string, steps: number): string[] {
  const rgb = parseHex(hex);
  const hsl = rgbToHsl(rgb);
  const result: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const l = Math.min(100, hsl.l + i * Math.floor((100 - hsl.l) / (steps + 1)));
    result.push(rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l })));
  }
  return result;
}

export function complementaryColor(hex: string): string {
  const rgb = parseHex(hex);
  const hsl = rgbToHsl(rgb);
  const compH = (hsl.h + 180) % 360;
  return rgbToHex(hslToRgb({ h: compH, s: hsl.s, l: hsl.l }));
}

// ─── Tailwind hint ────────────────────────────────────────────────────────────

export function tailwindHint(hsl: HSL): string {
  const { h, s, l } = hsl;
  if (s < 10) {
    if (l > 90) return 'gray-50 / white';
    if (l > 70) return 'gray-200 / gray-300';
    if (l > 50) return 'gray-400 / gray-500';
    if (l > 30) return 'gray-600 / gray-700';
    return 'gray-800 / gray-900';
  }
  let colorName = 'gray';
  if (h < 15 || h >= 345) colorName = 'red';
  else if (h < 45) colorName = 'orange';
  else if (h < 65) colorName = 'yellow';
  else if (h < 150) colorName = 'green';
  else if (h < 195) colorName = 'teal';
  else if (h < 255) colorName = 'blue';
  else if (h < 285) colorName = 'indigo';
  else if (h < 315) colorName = 'purple';
  else colorName = 'pink';

  let shade = '500';
  if (l > 90) shade = '50';
  else if (l > 80) shade = '100';
  else if (l > 70) shade = '200';
  else if (l > 60) shade = '300';
  else if (l > 50) shade = '400';
  else if (l > 40) shade = '500';
  else if (l > 30) shade = '600';
  else if (l > 20) shade = '700';
  else if (l > 10) shade = '800';
  else shade = '900';

  return colorName + '-' + shade;
}

// ─── Main analysis function ───────────────────────────────────────────────────

export function analyzeColor(input: string): ColorAnalysis {
  const rgb = parseHex(input);
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const comp = complementaryColor(hex);
  const shades = generateShades(hex, 5);
  const tints = generateTints(hex, 5);

  const cssVarName = '--color-primary';
  const cssVariable =
    cssVarName + ': ' + hex + ';\n' +
    cssVarName + '-rgb: ' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ';\n' +
    cssVarName + '-hsl: ' + hsl.h + 'deg ' + hsl.s + '% ' + hsl.l + '%;';

  const tailwindHintStr = tailwindHint(hsl);

  return { hex, rgb, hsl, hsv, cmyk, complementary: comp, shades, tints, cssVariable, tailwindHint: tailwindHintStr };
}

export function formatColorAnalysis(analysis: ColorAnalysis): string {
  const { hex, rgb, hsl, hsv, cmyk, complementary, shades, tints, cssVariable, tailwindHint: tw } = analysis;
  const lines: string[] = [];
  lines.push('HEX:          ' + hex.toUpperCase());
  lines.push('RGB:          rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')');
  lines.push('HSL:          hsl(' + hsl.h + 'deg, ' + hsl.s + '%, ' + hsl.l + '%)');
  lines.push('HSV:          hsv(' + hsv.h + 'deg, ' + hsv.s + '%, ' + hsv.v + '%)');
  lines.push('CMYK:         cmyk(' + cmyk.c + '%, ' + cmyk.m + '%, ' + cmyk.y + '%, ' + cmyk.k + '%)');
  lines.push('');
  lines.push('Complementary: ' + complementary.toUpperCase());
  lines.push('');
  lines.push('Darker shades: ' + shades.map(s => s.toUpperCase()).join('  '));
  lines.push('Lighter tints: ' + tints.map(t => t.toUpperCase()).join('  '));
  lines.push('');
  lines.push('CSS Variables:');
  lines.push(cssVariable);
  lines.push('');
  lines.push('Tailwind hint: ' + tw);
  return lines.join('\n');
}
