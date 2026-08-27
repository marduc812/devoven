export function kelvinToMired(k: number): number {
  return Math.round(1000000 / k);
}

export function miredToKelvin(m: number): number {
  return Math.round(1000000 / m);
}

// Approximate conversion from Kelvin to RGB (Tanner Helland algorithm)
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
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function describeTemperature(kelvin: number): string {
  if (kelvin < 2700) return 'Warm/Candlelight';
  if (kelvin < 3000) return 'Warm White';
  if (kelvin < 4000) return 'Neutral White';
  if (kelvin < 5000) return 'Cool White';
  if (kelvin < 6500) return 'Daylight';
  if (kelvin < 7500) return 'Overcast Sky';
  return 'Blue Sky / Cold';
}

// The Tanner Helland fit is only meaningful over roughly this span, so the
// slider and the spectrum ruler both stay inside it.
export const KELVIN_MIN = 1000;
export const KELVIN_MAX = 12000;

export type TemperaturePreset = { name: string; kelvin: number; note: string };

export const TEMPERATURE_PRESETS: TemperaturePreset[] = [
  { name: 'Candle', kelvin: 1900, note: 'deep amber' },
  { name: 'Tungsten', kelvin: 2700, note: 'household bulb' },
  { name: 'Halogen', kelvin: 3200, note: 'studio warm' },
  { name: 'Fluorescent', kelvin: 4200, note: 'office tube' },
  { name: 'Noon Sun', kelvin: 5500, note: 'photographic white' },
  { name: 'D65', kelvin: 6500, note: 'monitor white point' },
  { name: 'Shade', kelvin: 7500, note: 'blue cast' },
  { name: 'Blue Sky', kelvin: 10000, note: 'deep blue' },
];

/** Evenly spaced Kelvin samples with their hex, for drawing the spectrum ruler. */
export function spectrumStops(steps = 24): Array<{ kelvin: number; hex: string; offset: number }> {
  const stops: Array<{ kelvin: number; hex: string; offset: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const kelvin = Math.round(KELVIN_MIN + t * (KELVIN_MAX - KELVIN_MIN));
    const rgb = kelvinToRgb(kelvin);
    stops.push({ kelvin, hex: rgbToHex(rgb.r, rgb.g, rgb.b), offset: t * 100 });
  }
  return stops;
}

/** Perceived brightness of a channel triplet, used to pick readable overlay text. */
export function isDarkRgb(r: number, g: number, b: number): boolean {
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150;
}

export function formatColorTemperature(kelvin: number): string {
  const mired = kelvinToMired(kelvin);
  const rgb = kelvinToRgb(kelvin);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const description = describeTemperature(kelvin);

  return [
    `Kelvin:      ${kelvin}K`,
    `Mired:       ${mired} µrd`,
    `Description: ${description}`,
    `RGB:         rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    `Hex:         ${hex}`,
  ].join('\n');
}
