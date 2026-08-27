// White Balance Converter - logic.ts
// Converts Kelvin color temperature to photography white balance info.

export interface WhiteBalancePreset {
  name: string;
  kelvin: number;
  description: string;
}

export const WB_PRESETS: WhiteBalancePreset[] = [
  { name: 'Candle', kelvin: 1900, description: 'Flame, candles' },
  { name: 'Tungsten / Incandescent', kelvin: 3200, description: 'Indoor household bulbs' },
  { name: 'Fluorescent', kelvin: 4000, description: 'Office fluorescent lighting' },
  { name: 'Daylight', kelvin: 5500, description: 'Sunny outdoor, direct sun' },
  { name: 'Flash', kelvin: 5600, description: 'Camera flash, strobe' },
  { name: 'Cloudy', kelvin: 6500, description: 'Overcast sky, cloud cover' },
  { name: 'Shade', kelvin: 7500, description: 'Open shade, blue sky overhead' },
  { name: 'Blue sky', kelvin: 10000, description: 'Clear blue sky, snow shadows' },
];

// Approximate Kelvin → RGB using Tanner Helland algorithm
export function kelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = temp <= 0 ? 0 : Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
    b = temp >= 66 ? 255 : temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    b = 255;
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

export function getDescriptor(kelvin: number): string {
  if (kelvin < 2000) return 'Warm amber (flame-like)';
  if (kelvin < 3000) return 'Warm orange-white (tungsten)';
  if (kelvin < 4000) return 'Warm white (neutral-warm)';
  if (kelvin < 5000) return 'Neutral white (cool-white fluorescent)';
  if (kelvin < 6000) return 'Daylight white (neutral-cool)';
  if (kelvin < 7000) return 'Cool white (overcast)';
  if (kelvin < 9000) return 'Cool blue-white (shade)';
  return 'Very cool blue (clear sky)';
}

export function getSceneDescription(kelvin: number): string {
  if (kelvin < 2000) return 'Candle flames, fire';
  if (kelvin < 2700) return 'Sunrise/sunset, old incandescent bulbs';
  if (kelvin < 3500) return 'Tungsten studio lights, warm LED bulbs';
  if (kelvin < 4500) return 'Fluorescent office light, cool white LED';
  if (kelvin < 5500) return 'Morning/afternoon daylight, electronic flash';
  if (kelvin < 6500) return 'Noon sunlight, overcast sky';
  if (kelvin < 8000) return 'Open shade, heavily overcast sky';
  if (kelvin < 10000) return 'Blue sky (north-facing shade)';
  return 'Clear blue sky at high altitude';
}

export function getNearestPreset(kelvin: number): WhiteBalancePreset {
  return WB_PRESETS.reduce((a, b) =>
    Math.abs(a.kelvin - kelvin) <= Math.abs(b.kelvin - kelvin) ? a : b
  );
}

export function getCssFilter(kelvin: number): string {
  // Approximate CSS filter for white balance shift
  // Warm: sepia + warm hue, cool: hue-rotate into blues
  if (kelvin < 3500) {
    const warmth = Math.round(((3500 - kelvin) / 2500) * 60);
    const sepia = Math.round(((3500 - kelvin) / 2500) * 30);
    return `sepia(${sepia}%) hue-rotate(-${warmth}deg) brightness(0.95)`;
  }
  if (kelvin > 6500) {
    const cool = Math.round(((kelvin - 6500) / 5500) * 40);
    return `hue-rotate(${cool}deg) brightness(1.02) saturate(110%)`;
  }
  return 'none (daylight balanced)';
}

export function convertWhiteBalance(input: string): string {
  if (!input.trim()) return '';
  const trimmed = input.trim().replace(/k$/i, '');
  const k = parseInt(trimmed, 10);

  if (isNaN(k)) return 'Enter a Kelvin value (1000–12000), e.g. 5500';
  if (k < 1000 || k > 12000) return 'Kelvin value out of range. Enter between 1000 and 12000.';

  const rgb = kelvinToRgb(k);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const descriptor = getDescriptor(k);
  const scene = getSceneDescription(k);
  const preset = getNearestPreset(k);
  const cssFilter = getCssFilter(k);

  const lines: string[] = [];
  lines.push(`=== White Balance: ${k}K ===`);
  lines.push('');
  lines.push(`Descriptor:      ${descriptor}`);
  lines.push(`Scene/Lighting:  ${scene}`);
  lines.push('');
  lines.push(`Approx RGB:      rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  lines.push(`Approx Hex:      ${hex}`);
  lines.push('');
  lines.push(`Nearest Camera Preset:`);
  lines.push(`  ${preset.name} (${preset.kelvin}K) — ${preset.description}`);
  lines.push('');
  lines.push(`CSS Filter Approximation:`);
  lines.push(`  filter: ${cssFilter};`);
  lines.push('');
  lines.push('=== White Balance Presets ===');
  lines.push('');
  for (const p of WB_PRESETS) {
    const dist = Math.abs(p.kelvin - k);
    const marker = dist < 300 ? ' ← nearest' : '';
    lines.push(`  ${p.kelvin}K  ${p.name.padEnd(24)} ${p.description}${marker}`);
  }

  return lines.join('\n');
}
