export type RgbColor = { r: number; g: number; b: number };

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0]+h[0], 16),
      parseInt(h[1]+h[1], 16),
      parseInt(h[2]+h[2], 16),
    ];
  }
  if (h.length !== 6) throw new Error(`Invalid hex color: ${hex}`);
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0').toUpperCase()).join('');
}

export function hexToRgbColor(hex: string): RgbColor {
  const [r, g, b] = parseHex(hex);
  return { r, g, b };
}

export function mixColors(hex1: string, hex2: string, weight = 0.5): string {
  const [r1,g1,b1] = parseHex(hex1);
  const [r2,g2,b2] = parseHex(hex2);
  const r = r1 * weight + r2 * (1 - weight);
  const g = g1 * weight + g2 * (1 - weight);
  const b = b1 * weight + b2 * (1 - weight);
  return toHex(r, g, b);
}

export function generateMixSteps(hex1: string, hex2: string, steps = 5): string[] {
  const results: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const weight = 1 - i / steps;
    results.push(mixColors(hex1, hex2, weight));
  }
  return results;
}

/**
 * Alias for generateMixSteps for backwards compatibility (steps+1 items).
 */
export function generateColorScale(hex1: string, hex2: string, steps = 5): string[] {
  // Produce `steps` items: 0..steps-1 mapped over weight 0→1
  const result: string[] = [];
  for (let i = 0; i < steps; i++) {
    // weight=1 means hex1, weight=0 means hex2
    const weight = 1 - i / (steps - 1);
    result.push(mixColors(hex1, hex2, weight));
  }
  return result;
}

export function formatColorMix(hex1: string, hex2: string): string {
  const steps = generateMixSteps(hex1, hex2, 4);
  return [
    `Color 1: ${hex1.toUpperCase()}`,
    `Color 2: ${hex2.toUpperCase()}`,
    '',
    '=== Mix Gradient (5 steps) ===',
    ...steps.map((c, i) => `${Math.round(i * 25)}% blend: ${c}`),
  ].join('\n');
}
