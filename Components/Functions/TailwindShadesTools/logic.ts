export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ShadeStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export const SHADE_STEPS: ShadeStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export interface ShadeEntry {
  step: ShadeStep;
  hex: string;
  rgb: RGB;
  hsl: HSL;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error('Invalid hex color. Use format: #RRGGBB');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tVal = t;
    if (tVal < 0) tVal += 1;
    if (tVal > 1) tVal -= 1;
    if (tVal < 1 / 6) return p + (q - p) * 6 * tVal;
    if (tVal < 1 / 2) return q;
    if (tVal < 2 / 3) return p + (q - p) * (2 / 3 - tVal) * 6;
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

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Lightness targets per shade step (0=darkest, 100=lightest)
const LIGHTNESS_MAP: Record<ShadeStep, number> = {
  50: 96,
  100: 93,
  200: 86,
  300: 74,
  400: 61,
  500: 48,
  600: 38,
  700: 29,
  800: 21,
  900: 14,
  950: 9,
};

// Saturation scaling per step (relative to base)
const SATURATION_MAP: Record<ShadeStep, number> = {
  50: 0.20,
  100: 0.35,
  200: 0.55,
  300: 0.75,
  400: 0.90,
  500: 1.00,
  600: 0.95,
  700: 0.90,
  800: 0.80,
  900: 0.65,
  950: 0.50,
};

export function generateShades(hex: string): ShadeEntry[] {
  const rgb = hexToRgb(hex);
  const baseHsl = rgbToHsl(rgb);

  return SHADE_STEPS.map(step => {
    const targetL = LIGHTNESS_MAP[step];
    const satScale = SATURATION_MAP[step];
    const targetS = Math.min(100, baseHsl.s * satScale);

    const hsl: HSL = {
      h: baseHsl.h,
      s: Math.round(targetS),
      l: targetL,
    };
    const shadeRgb = hslToRgb(hsl);

    return {
      step,
      hex: rgbToHex(shadeRgb),
      rgb: shadeRgb,
      hsl,
    };
  });
}

export function formatShadesOutput(colorName: string, hex: string): string {
  const shades = generateShades(hex);
  const safeName = colorName.trim() || 'custom';

  const hexValues = shades.map(s => `  ${s.step}: '${s.hex}'`).join(',\n');
  const cssVars = shades.map(s => `  --color-${safeName}-${s.step}: ${s.hex};`).join('\n');

  const lines: string[] = [
    '/* CSS Custom Properties */',
    ':root {',
    cssVars,
    '}',
    '',
    '/* Tailwind Config (tailwind.config.js) */',
    `module.exports = {`,
    `  theme: {`,
    `    extend: {`,
    `      colors: {`,
    `        '${safeName}': {`,
    hexValues,
    `        },`,
    `      },`,
    `    },`,
    `  },`,
    `};`,
    '',
    '/* Hex Values */',
    shades.map(s => `${s.step}: ${s.hex}  rgb(${s.rgb.r}, ${s.rgb.g}, ${s.rgb.b})`).join('\n'),
  ];

  return lines.join('\n');
}
