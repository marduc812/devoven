// Resistor Color Code Decoder — pure logic, no browser APIs

export const BAND_COLORS = [
  'black', 'brown', 'red', 'orange', 'yellow',
  'green', 'blue', 'violet', 'grey', 'white',
] as const;

export type BandColor = typeof BAND_COLORS[number];

export const BAND_DIGITS: Record<BandColor, number> = {
  black: 0, brown: 1, red: 2, orange: 3, yellow: 4,
  green: 5, blue: 6, violet: 7, grey: 8, white: 9,
};

// Multiplier bands (4 and 5 band): silver=0.01, gold=0.1, black=1, brown=10, ...
export type MultiplierColor = BandColor | 'gold' | 'silver';

export const MULTIPLIERS: Record<MultiplierColor, number> = {
  silver: 0.01,
  gold:   0.1,
  black:  1,
  brown:  10,
  red:    100,
  orange: 1_000,
  yellow: 10_000,
  green:  100_000,
  blue:   1_000_000,
  violet: 10_000_000,
  grey:   100_000_000,
  white:  1_000_000_000,
};

export const TOLERANCES: Partial<Record<MultiplierColor, string>> = {
  brown:  '±1%',
  red:    '±2%',
  green:  '±0.5%',
  blue:   '±0.25%',
  violet: '±0.1%',
  grey:   '±0.05%',
  gold:   '±5%',
  silver: '±10%',
};

export type DecodeResult = {
  resistance: number;
  tolerance: string;
  bands: string[];
  formatted: string;
  eSeries: string;
};

function normalizeColor(s: string): string {
  return s.trim().toLowerCase()
    .replace(/gr[ae]y/, 'grey')
    .replace(/purple/, 'violet');
}

function formatResistance(ohms: number): string {
  if (ohms >= 1e9) return `${(ohms / 1e9).toPrecision(4).replace(/\.?0+$/, '')} GΩ`;
  if (ohms >= 1e6) return `${(ohms / 1e6).toPrecision(4).replace(/\.?0+$/, '')} MΩ`;
  if (ohms >= 1e3) return `${(ohms / 1e3).toPrecision(4).replace(/\.?0+$/, '')} kΩ`;
  return `${parseFloat(ohms.toPrecision(4))} Ω`;
}

/** Decode 4-band resistor: digit, digit, multiplier, tolerance */
export function decode4Band(bands: string[]): DecodeResult {
  if (bands.length !== 4) throw new Error('4-band requires exactly 4 colors');

  const c1 = normalizeColor(bands[0]) as BandColor;
  const c2 = normalizeColor(bands[1]) as BandColor;
  const cm = normalizeColor(bands[2]) as MultiplierColor;
  const ct = normalizeColor(bands[3]) as MultiplierColor;

  if (BAND_DIGITS[c1] === undefined) throw new Error(`Unknown color: ${bands[0]}`);
  if (BAND_DIGITS[c2] === undefined) throw new Error(`Unknown color: ${bands[1]}`);
  if (MULTIPLIERS[cm] === undefined) throw new Error(`Unknown multiplier color: ${bands[2]}`);

  const significand = BAND_DIGITS[c1] * 10 + BAND_DIGITS[c2];
  const resistance = significand * MULTIPLIERS[cm];
  const tolerance = TOLERANCES[ct] || '±20%';

  return {
    resistance,
    tolerance,
    bands,
    formatted: formatResistance(resistance),
    eSeries: findESeries(resistance),
  };
}

/** Decode 5-band resistor: digit, digit, digit, multiplier, tolerance */
export function decode5Band(bands: string[]): DecodeResult {
  if (bands.length !== 5) throw new Error('5-band requires exactly 5 colors');

  const c1 = normalizeColor(bands[0]) as BandColor;
  const c2 = normalizeColor(bands[1]) as BandColor;
  const c3 = normalizeColor(bands[2]) as BandColor;
  const cm = normalizeColor(bands[3]) as MultiplierColor;
  const ct = normalizeColor(bands[4]) as MultiplierColor;

  if (BAND_DIGITS[c1] === undefined) throw new Error(`Unknown color: ${bands[0]}`);
  if (BAND_DIGITS[c2] === undefined) throw new Error(`Unknown color: ${bands[1]}`);
  if (BAND_DIGITS[c3] === undefined) throw new Error(`Unknown color: ${bands[2]}`);
  if (MULTIPLIERS[cm] === undefined) throw new Error(`Unknown multiplier color: ${bands[3]}`);

  const significand = BAND_DIGITS[c1] * 100 + BAND_DIGITS[c2] * 10 + BAND_DIGITS[c3];
  const resistance = significand * MULTIPLIERS[cm];
  const tolerance = TOLERANCES[ct] || '±20%';

  return {
    resistance,
    tolerance,
    bands,
    formatted: formatResistance(resistance),
    eSeries: findESeries(resistance),
  };
}

/** Parse a comma-separated list of color names and decode based on count. */
export function decodeColorBands(input: string): DecodeResult {
  if (!input.trim()) throw new Error('Enter color bands separated by commas');
  const bands = input.split(',').map(s => s.trim()).filter(Boolean);
  if (bands.length === 4) return decode4Band(bands);
  if (bands.length === 5) return decode5Band(bands);
  throw new Error(`Expected 4 or 5 color bands, got ${bands.length}`);
}

// ─── E-series ────────────────────────────────────────────────────────────────

const E12_VALUES = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const E24_VALUES = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];
const E96_VALUES = [
  1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30,
  1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74,
  1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32,
  2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09,
  3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
  4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49,
  5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32,
  7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76,
];

function closestInSeries(ohms: number, series: number[]): number {
  const exp = Math.floor(Math.log10(ohms));
  const decade = Math.pow(10, exp);
  const norm = ohms / decade;

  let best = series[0];
  let bestDist = Math.abs(norm - series[0]);
  for (const v of series) {
    const dist = Math.abs(norm - v);
    if (dist < bestDist) { bestDist = dist; best = v; }
  }
  return best * decade;
}

/** Find the closest E12, E24, E96 standard values for a given resistance. */
export function findESeries(ohms: number): string {
  if (ohms <= 0 || !isFinite(ohms)) return 'N/A';
  const e12 = closestInSeries(ohms, E12_VALUES);
  const e24 = closestInSeries(ohms, E24_VALUES);
  const e96 = closestInSeries(ohms, E96_VALUES);

  return `E12: ${formatResistance(e12)}, E24: ${formatResistance(e24)}, E96: ${formatResistance(e96)}`;
}

/** Find color bands for a given resistance value (4-band). */
export function resistanceToBands4(ohms: number): string[] | null {
  if (ohms <= 0 || !isFinite(ohms)) return null;

  const exp = Math.floor(Math.log10(ohms)) - 1;
  const multiplierVal = Math.pow(10, exp);
  const significand = Math.round(ohms / multiplierVal);

  if (significand < 10 || significand > 99) return null;

  const d1 = Math.floor(significand / 10);
  const d2 = significand % 10;

  const MULT_BANDS: MultiplierColor[] = [
    'silver', 'gold', 'black', 'brown', 'red', 'orange', 'yellow',
    'green', 'blue', 'violet', 'grey', 'white',
  ];
  const multIdx = exp + 2;
  if (multIdx < 0 || multIdx >= MULT_BANDS.length) return null;
  if (d1 < 0 || d1 > 9 || d2 < 0 || d2 > 9) return null;

  return [BAND_COLORS[d1], BAND_COLORS[d2], MULT_BANDS[multIdx], 'gold'];
}
