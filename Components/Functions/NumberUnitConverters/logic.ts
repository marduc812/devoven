// All functions in this file are pure (no React, no browser APIs).
// They take primitives and return primitives, throwing descriptive errors on bad input.

// ─── Binary ↔ Decimal ─────────────────────────────────────────────────────────

export function binaryToDecimal(input: string): string {
  if (!input.trim()) return '';
  const cleaned = input.trim();
  if (!/^[01]+$/.test(cleaned)) throw new Error('Invalid binary input: only 0 and 1 are allowed');
  return parseInt(cleaned, 2).toString(10);
}

export function decimalToBinary(input: string): string {
  if (!input.trim()) return '';
  const num = parseInt(input.trim(), 10);
  if (isNaN(num)) throw new Error('Invalid decimal input');
  if (num < 0) throw new Error('Negative numbers are not supported');
  return num.toString(2);
}

// ─── Roman Numerals ↔ Arabic ──────────────────────────────────────────────────

export function romanToArabic(input: string): string {
  if (!input.trim()) return '';
  const upper = input.trim().toUpperCase();
  const romanValues: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100],  ['XC', 90],  ['L', 50],  ['XL', 40],
    ['X', 10],   ['IX', 9],   ['V', 5],   ['IV', 4],
    ['I', 1],
  ];
  if (!/^[MDCLXVI]+$/.test(upper)) throw new Error('Invalid Roman numeral');
  let i = 0;
  let result = 0;
  while (i < upper.length) {
    const two = upper.slice(i, i + 2);
    const pair = romanValues.find(([r]) => r === two);
    if (pair) { result += pair[1]; i += 2; continue; }
    const one = romanValues.find(([r]) => r === upper[i]);
    if (!one) throw new Error(`Unrecognised character: ${upper[i]}`);
    result += one[1];
    i += 1;
  }
  if (result < 1 || result > 3999) throw new Error('Roman numeral out of range (1–3999)');
  return result.toString();
}

export function arabicToRoman(input: string): string {
  if (!input.trim()) return '';
  const num = parseInt(input.trim(), 10);
  if (isNaN(num)) throw new Error('Invalid integer');
  if (num < 1 || num > 3999) throw new Error('Number out of range (1–3999)');
  const romanValues: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100],  ['XC', 90],  ['L', 50],  ['XL', 40],
    ['X', 10],   ['IX', 9],   ['V', 5],   ['IV', 4],
    ['I', 1],
  ];
  let result = '';
  let remaining = num;
  for (const [roman, value] of romanValues) {
    while (remaining >= value) {
      result += roman;
      remaining -= value;
    }
  }
  return result;
}

// ─── Number to Words ──────────────────────────────────────────────────────────

export function numberToWords(input: string): string {
  if (!input.trim()) return '';
  const num = Number(input.trim());
  if (!Number.isFinite(num)) throw new Error('Invalid number');
  if (!Number.isInteger(num)) throw new Error('Only integers are supported');
  if (num < -999_999_999_999_999 || num > 999_999_999_999_999)
    throw new Error('Number out of supported range (±999 trillion)');

  if (num === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
    'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty',
    'sixty', 'seventy', 'eighty', 'ninety'];

  function belowThousand(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const t = tens[Math.floor(n / 10)];
      const o = ones[n % 10];
      return o ? `${t}-${o}` : t;
    }
    const h = ones[Math.floor(n / 100)];
    const rest = belowThousand(n % 100);
    return rest ? `${h} hundred ${rest}` : `${h} hundred`;
  }

  const scales = [
    { value: 1_000_000_000_000, name: 'trillion' },
    { value: 1_000_000_000,     name: 'billion'  },
    { value: 1_000_000,         name: 'million'  },
    { value: 1_000,             name: 'thousand' },
  ];

  const sign = num < 0 ? 'negative ' : '';
  let abs = Math.abs(num);
  const parts: string[] = [];

  for (const { value, name } of scales) {
    if (abs >= value) {
      parts.push(`${belowThousand(Math.floor(abs / value))} ${name}`);
      abs %= value;
    }
  }
  if (abs > 0) parts.push(belowThousand(abs));

  return sign + parts.join(', ');
}

// ─── Unit conversion helpers ──────────────────────────────────────────────────
// All unit converters follow the same pattern:
//   1. convert value to a canonical SI base unit
//   2. convert from base unit to the target unit
// This makes round-trips exact (within floating-point precision).

// ─── Length ───────────────────────────────────────────────────────────────────
// Base unit: metre (m)

const LENGTH_TO_METRES: Record<string, number> = {
  m:  1,
  km: 1_000,
  cm: 0.01,
  mm: 0.001,
  mi: 1_609.344,
  yd: 0.9144,
  ft: 0.3048,
  in: 0.0254,
};

export const LENGTH_UNITS = ['m', 'km', 'cm', 'mm', 'mi', 'yd', 'ft', 'in'] as const;
export type LengthUnit = typeof LENGTH_UNITS[number];

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  return (value * LENGTH_TO_METRES[from]) / LENGTH_TO_METRES[to];
}

export function getAllLengthConversions(value: number, from: LengthUnit): Record<LengthUnit, number> {
  return Object.fromEntries(
    LENGTH_UNITS.map(u => [u, convertLength(value, from, u)])
  ) as Record<LengthUnit, number>;
}

// ─── Weight ───────────────────────────────────────────────────────────────────
// Base unit: kilogram (kg)

const WEIGHT_TO_KG: Record<string, number> = {
  kg: 1,
  g:  0.001,
  lb: 0.45359237,
  oz: 0.028349523125,
  t:  1_000,       // metric tonne
};

export const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz', 't'] as const;
export type WeightUnit = typeof WEIGHT_UNITS[number];

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  return (value * WEIGHT_TO_KG[from]) / WEIGHT_TO_KG[to];
}

export function getAllWeightConversions(value: number, from: WeightUnit): Record<WeightUnit, number> {
  return Object.fromEntries(
    WEIGHT_UNITS.map(u => [u, convertWeight(value, from, u)])
  ) as Record<WeightUnit, number>;
}

// ─── Temperature ──────────────────────────────────────────────────────────────
// Temperature cannot use a simple multiplier; each pair needs its own formula.

export const TEMPERATURE_UNITS = ['C', 'F', 'K'] as const;
export type TemperatureUnit = typeof TEMPERATURE_UNITS[number];

function toCelsius(value: number, from: TemperatureUnit): number {
  switch (from) {
    case 'C': return value;
    case 'F': return (value - 32) * 5 / 9;
    case 'K': return value - 273.15;
  }
}

function fromCelsius(celsius: number, to: TemperatureUnit): number {
  switch (to) {
    case 'C': return celsius;
    case 'F': return celsius * 9 / 5 + 32;
    case 'K': return celsius + 273.15;
  }
}

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  return fromCelsius(toCelsius(value, from), to);
}

export function getAllTemperatureConversions(value: number, from: TemperatureUnit): Record<TemperatureUnit, number> {
  return Object.fromEntries(
    TEMPERATURE_UNITS.map(u => [u, convertTemperature(value, from, u)])
  ) as Record<TemperatureUnit, number>;
}

// ─── Speed ────────────────────────────────────────────────────────────────────
// Base unit: metres per second (m/s)

const SPEED_TO_MS: Record<string, number> = {
  'ms':    1,           // m/s stored as 'ms' key
  'kmh':   1 / 3.6,    // km/h stored as 'kmh'
  'mph':   0.44704,
  'knots': 0.514444,
};

export const SPEED_UNITS = ['ms', 'kmh', 'mph', 'knots'] as const;
export type SpeedUnit = typeof SPEED_UNITS[number];

export const SPEED_LABELS: Record<SpeedUnit, string> = {
  ms:    'm/s',
  kmh:   'km/h',
  mph:   'mph',
  knots: 'knots',
};

export function convertSpeed(value: number, from: SpeedUnit, to: SpeedUnit): number {
  return (value * SPEED_TO_MS[from]) / SPEED_TO_MS[to];
}

export function getAllSpeedConversions(value: number, from: SpeedUnit): Record<SpeedUnit, number> {
  return Object.fromEntries(
    SPEED_UNITS.map(u => [u, convertSpeed(value, from, u)])
  ) as Record<SpeedUnit, number>;
}

// ─── Area ─────────────────────────────────────────────────────────────────────
// Base unit: square metre (m²)

const AREA_TO_SQM: Record<string, number> = {
  'm2':   1,
  'km2':  1_000_000,
  'ft2':  0.09290304,
  'mi2':  2_589_988.110336,
  'acre': 4_046.8564224,
  'ha':   10_000,
};

export const AREA_UNITS = ['m2', 'km2', 'ft2', 'mi2', 'acre', 'ha'] as const;
export type AreaUnit = typeof AREA_UNITS[number];

export const AREA_LABELS: Record<AreaUnit, string> = {
  m2:   'm²',
  km2:  'km²',
  ft2:  'ft²',
  mi2:  'mi²',
  acre: 'acre',
  ha:   'ha',
};

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  return (value * AREA_TO_SQM[from]) / AREA_TO_SQM[to];
}

export function getAllAreaConversions(value: number, from: AreaUnit): Record<AreaUnit, number> {
  return Object.fromEntries(
    AREA_UNITS.map(u => [u, convertArea(value, from, u)])
  ) as Record<AreaUnit, number>;
}

// ─── Volume ───────────────────────────────────────────────────────────────────
// Base unit: litre (L)

const VOLUME_TO_LITRES: Record<string, number> = {
  L:     1,
  mL:    0.001,
  m3:    1_000,
  gal:   3.785411784,    // US liquid gallon
  qt:    0.946352946,    // US quart
  pt:    0.473176473,    // US pint
  floz:  0.0295735296,   // US fluid ounce
};

export const VOLUME_UNITS = ['L', 'mL', 'm3', 'gal', 'qt', 'pt', 'floz'] as const;
export type VolumeUnit = typeof VOLUME_UNITS[number];

export const VOLUME_LABELS: Record<VolumeUnit, string> = {
  L:    'L',
  mL:   'mL',
  m3:   'm³',
  gal:  'gal',
  qt:   'qt',
  pt:   'pt',
  floz: 'fl oz',
};

export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  return (value * VOLUME_TO_LITRES[from]) / VOLUME_TO_LITRES[to];
}

export function getAllVolumeConversions(value: number, from: VolumeUnit): Record<VolumeUnit, number> {
  return Object.fromEntries(
    VOLUME_UNITS.map(u => [u, convertVolume(value, from, u)])
  ) as Record<VolumeUnit, number>;
}

// ─── Data Size ────────────────────────────────────────────────────────────────
// Base unit: byte (B), using binary (base-1024) prefixes

const DATA_TO_BYTES: Record<string, number> = {
  B:  1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
  PB: 1024 ** 5,
};

export const DATA_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
export type DataUnit = typeof DATA_UNITS[number];

export function convertDataSize(value: number, from: DataUnit, to: DataUnit): number {
  return (value * DATA_TO_BYTES[from]) / DATA_TO_BYTES[to];
}

export function getAllDataSizeConversions(value: number, from: DataUnit): Record<DataUnit, number> {
  return Object.fromEntries(
    DATA_UNITS.map(u => [u, convertDataSize(value, from, u)])
  ) as Record<DataUnit, number>;
}

// ─── Angle ────────────────────────────────────────────────────────────────────
// Base unit: degree (deg)

const ANGLE_TO_DEG: Record<string, number> = {
  deg:  1,
  rad:  180 / Math.PI,
  grad: 0.9,             // 1 grad = 0.9 degrees
};

export const ANGLE_UNITS = ['deg', 'rad', 'grad'] as const;
export type AngleUnit = typeof ANGLE_UNITS[number];

export const ANGLE_LABELS: Record<AngleUnit, string> = {
  deg:  'deg',
  rad:  'rad',
  grad: 'grad',
};

export function convertAngle(value: number, from: AngleUnit, to: AngleUnit): number {
  return (value * ANGLE_TO_DEG[from]) / ANGLE_TO_DEG[to];
}

export function getAllAngleConversions(value: number, from: AngleUnit): Record<AngleUnit, number> {
  return Object.fromEntries(
    ANGLE_UNITS.map(u => [u, convertAngle(value, from, u)])
  ) as Record<AngleUnit, number>;
}

// ─── Bitrate ──────────────────────────────────────────────────────────────────
// Base unit: bit per second (bps)

const BITRATE_TO_BPS: Record<string, number> = {
  bps:  1,
  kbps: 1_000,
  Mbps: 1_000_000,
  Gbps: 1_000_000_000,
};

export const BITRATE_UNITS = ['bps', 'kbps', 'Mbps', 'Gbps'] as const;
export type BitrateUnit = typeof BITRATE_UNITS[number];

export function convertBitrate(value: number, from: BitrateUnit, to: BitrateUnit): number {
  return (value * BITRATE_TO_BPS[from]) / BITRATE_TO_BPS[to];
}

export function getAllBitrateConversions(value: number, from: BitrateUnit): Record<BitrateUnit, number> {
  return Object.fromEntries(
    BITRATE_UNITS.map(u => [u, convertBitrate(value, from, u)])
  ) as Record<BitrateUnit, number>;
}
