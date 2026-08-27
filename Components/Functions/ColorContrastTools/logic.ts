export type WcagResult = {
  ratio: number;
  ratioFormatted: string;
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
  color1: string;
  color2: string;
  luminance1: number;
  luminance2: number;
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) throw new Error('Invalid hex color: ' + hex);
  const num = parseInt(h, 16);
  if (isNaN(num)) throw new Error('Invalid hex color: ' + hex);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function checkContrast(hex1: string, hex2: string): WcagResult {
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);

  const lum1 = relativeLuminance(c1.r, c1.g, c1.b);
  const lum2 = relativeLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    ratioFormatted: ratio.toFixed(2) + ':1',
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7.0,
    largeAA: ratio >= 3.0,
    largeAAA: ratio >= 4.5,
    color1: hex1.trim().startsWith('#') ? hex1.trim() : '#' + hex1.trim(),
    color2: hex2.trim().startsWith('#') ? hex2.trim() : '#' + hex2.trim(),
    luminance1: lum1,
    luminance2: lum2,
  };
}

