// Extended Unit Converter — pure logic, no browser APIs.
// Categories: length, mass, temperature, speed, pressure, energy, power
// Auto-detects category and input unit from free-text input.

// ─── Types ───────────────────────────────────────────────────────────────────

export type Category = 'length' | 'mass' | 'temperature' | 'speed' | 'pressure' | 'energy' | 'power';

export interface ConversionRow {
  unit: string;
  label: string;
  value: number;
}

export interface ConversionResult {
  category: Category;
  inputValue: number;
  inputUnit: string;
  rows: ConversionRow[];
}

// ─── Length ───────────────────────────────────────────────────────────────────
// Base unit: metre

const LENGTH: Record<string, { toBase: number; label: string; aliases: string[] }> = {
  mm:  { toBase: 0.001, label: 'Millimetre (mm)', aliases: ['mm', 'millimeter', 'millimetre', 'millimeters', 'millimetres'] },
  cm:  { toBase: 0.01,  label: 'Centimetre (cm)', aliases: ['cm', 'centimeter', 'centimetre', 'centimeters', 'centimetres'] },
  m:   { toBase: 1,     label: 'Metre (m)',        aliases: ['m', 'meter', 'metre', 'meters', 'metres'] },
  km:  { toBase: 1000,  label: 'Kilometre (km)',   aliases: ['km', 'kilometer', 'kilometre', 'kilometers', 'kilometres'] },
  in:  { toBase: 0.0254,   label: 'Inch (in)',     aliases: ['in', 'inch', 'inches', '"'] },
  ft:  { toBase: 0.3048,   label: 'Foot (ft)',     aliases: ['ft', 'foot', 'feet', "'"] },
  yd:  { toBase: 0.9144,   label: 'Yard (yd)',     aliases: ['yd', 'yard', 'yards'] },
  mi:  { toBase: 1609.344, label: 'Mile (mi)',      aliases: ['mi', 'mile', 'miles'] },
  nm:  { toBase: 1852,     label: 'Nautical Mile (nm)', aliases: ['nm', 'nautical mile', 'nautical miles', 'nmi'] },
  ly:  { toBase: 9.461e15, label: 'Light-year (ly)',   aliases: ['ly', 'light-year', 'light year', 'light-years'] },
};

// ─── Mass ─────────────────────────────────────────────────────────────────────
// Base unit: kilogram

const MASS: Record<string, { toBase: number; label: string; aliases: string[] }> = {
  mg:  { toBase: 1e-6,  label: 'Milligram (mg)',    aliases: ['mg', 'milligram', 'milligrams'] },
  g:   { toBase: 0.001, label: 'Gram (g)',           aliases: ['g', 'gram', 'grams'] },
  kg:  { toBase: 1,     label: 'Kilogram (kg)',      aliases: ['kg', 'kilogram', 'kilograms'] },
  t:   { toBase: 1000,  label: 'Tonne (t)',          aliases: ['t', 'tonne', 'tonnes', 'metric ton', 'metric tons'] },
  oz:  { toBase: 0.028349523125, label: 'Ounce (oz)', aliases: ['oz', 'ounce', 'ounces'] },
  lb:  { toBase: 0.45359237,    label: 'Pound (lb)', aliases: ['lb', 'lbs', 'pound', 'pounds'] },
  st:  { toBase: 6.35029318,    label: 'Stone (st)', aliases: ['st', 'stone', 'stones'] },
};

// ─── Temperature ──────────────────────────────────────────────────────────────

const TEMP_UNITS = ['C', 'F', 'K', 'R'] as const;
type TempUnit = typeof TEMP_UNITS[number];

const TEMP_ALIASES: Record<TempUnit, string[]> = {
  C: ['c', '°c', 'celsius', 'centigrade'],
  F: ['f', '°f', 'fahrenheit'],
  K: ['k', 'kelvin'],
  R: ['r', '°r', 'rankine'],
};

const TEMP_LABELS: Record<TempUnit, string> = {
  C: 'Celsius (°C)',
  F: 'Fahrenheit (°F)',
  K: 'Kelvin (K)',
  R: 'Rankine (°R)',
};

function toCelsius(val: number, from: TempUnit): number {
  switch (from) {
    case 'C': return val;
    case 'F': return (val - 32) * 5 / 9;
    case 'K': return val - 273.15;
    case 'R': return (val - 491.67) * 5 / 9;
  }
}

function fromCelsius(c: number, to: TempUnit): number {
  switch (to) {
    case 'C': return c;
    case 'F': return c * 9 / 5 + 32;
    case 'K': return c + 273.15;
    case 'R': return (c + 273.15) * 9 / 5;
  }
}

// ─── Speed ────────────────────────────────────────────────────────────────────
// Base unit: m/s

const SPEED: Record<string, { toBase: number; label: string; aliases: string[] }> = {
  'ms':    { toBase: 1,          label: 'm/s',       aliases: ['m/s', 'ms', 'mps', 'meters per second', 'metres per second'] },
  'kmh':   { toBase: 1 / 3.6,   label: 'km/h',      aliases: ['km/h', 'kmh', 'kph', 'kmph', 'kilometers per hour', 'kilometres per hour'] },
  'mph':   { toBase: 0.44704,    label: 'mph',       aliases: ['mph', 'miles per hour'] },
  'knots': { toBase: 0.514444,   label: 'Knots',     aliases: ['knots', 'kn', 'kt', 'knot'] },
  'mach':  { toBase: 340.29,     label: 'Mach',      aliases: ['mach', 'ma', 'mach number'] },
  'fts':   { toBase: 0.3048,     label: 'ft/s',      aliases: ['ft/s', 'fps', 'fts', 'feet per second'] },
};

// ─── Pressure ─────────────────────────────────────────────────────────────────
// Base unit: Pascal

const PRESSURE: Record<string, { toBase: number; label: string; aliases: string[] }> = {
  'Pa':   { toBase: 1,           label: 'Pascal (Pa)',    aliases: ['pa', 'pascal', 'pascals'] },
  'kPa':  { toBase: 1000,        label: 'Kilopascal (kPa)', aliases: ['kpa', 'kilopascal', 'kilopascals'] },
  'bar':  { toBase: 100000,      label: 'Bar',            aliases: ['bar', 'bars'] },
  'mbar': { toBase: 100,         label: 'Millibar (mbar)', aliases: ['mbar', 'millibar', 'millibars'] },
  'psi':  { toBase: 6894.757,    label: 'PSI',            aliases: ['psi', 'pounds per square inch'] },
  'atm':  { toBase: 101325,      label: 'Atmosphere (atm)', aliases: ['atm', 'atmosphere', 'atmospheres'] },
  'mmhg': { toBase: 133.322,     label: 'mmHg (Torr)',    aliases: ['mmhg', 'torr', 'mm hg', 'mm mercury'] },
  'inhg': { toBase: 3386.389,    label: 'inHg',           aliases: ['inhg', 'in hg', 'inches of mercury'] },
};

// ─── Energy ───────────────────────────────────────────────────────────────────
// Base unit: Joule

const ENERGY: Record<string, { toBase: number; label: string; aliases: string[] }> = {
  'J':    { toBase: 1,            label: 'Joule (J)',        aliases: ['j', 'joule', 'joules'] },
  'kJ':   { toBase: 1000,         label: 'Kilojoule (kJ)',   aliases: ['kj', 'kilojoule', 'kilojoules'] },
  'cal':  { toBase: 4.184,        label: 'Calorie (cal)',    aliases: ['cal', 'calorie', 'calories'] },
  'kcal': { toBase: 4184,         label: 'Kilocalorie (kcal)', aliases: ['kcal', 'kilocalorie', 'kilocalories', 'food calorie'] },
  'kWh':  { toBase: 3600000,      label: 'Kilowatt-hour (kWh)', aliases: ['kwh', 'kw·h', 'kw-h', 'kilowatt hour', 'kilowatt-hour'] },
  'Wh':   { toBase: 3600,         label: 'Watt-hour (Wh)',   aliases: ['wh', 'watt hour', 'watt-hour'] },
  'BTU':  { toBase: 1055.06,      label: 'BTU',              aliases: ['btu', 'british thermal unit'] },
  'eV':   { toBase: 1.60218e-19,  label: 'Electron-volt (eV)', aliases: ['ev', 'electron volt', 'electron-volt'] },
  'ft·lb':{ toBase: 1.35582,      label: 'Foot-pound (ft·lb)', aliases: ['ft·lb', 'ft-lb', 'ftlb', 'foot pound', 'foot-pound'] },
};

// ─── Power ────────────────────────────────────────────────────────────────────
// Base unit: Watt

const POWER: Record<string, { toBase: number; label: string; aliases: string[] }> = {
  'W':     { toBase: 1,         label: 'Watt (W)',           aliases: ['w', 'watt', 'watts'] },
  'kW':    { toBase: 1000,      label: 'Kilowatt (kW)',      aliases: ['kw', 'kilowatt', 'kilowatts'] },
  'MW':    { toBase: 1e6,       label: 'Megawatt (MW)',      aliases: ['mw', 'megawatt', 'megawatts'] },
  'hp':    { toBase: 745.69987, label: 'Horsepower (hp)',    aliases: ['hp', 'horsepower'] },
  'BTU/h': { toBase: 0.29307,  label: 'BTU/hr',             aliases: ['btu/h', 'btu/hr', 'btu per hour'] },
  'cal/s': { toBase: 4.184,    label: 'cal/s',              aliases: ['cal/s', 'calories per second'] },
};

// ─── Category auto-detection ─────────────────────────────────────────────────

type UnitTable = Record<string, { toBase: number; label: string; aliases: string[] }>;

function findUnit(raw: string, table: UnitTable): string | null {
  const lower = raw.toLowerCase().trim();
  for (const [key, { aliases }] of Object.entries(table)) {
    if (aliases.includes(lower)) return key;
  }
  return null;
}

function findTempUnit(raw: string): TempUnit | null {
  const lower = raw.toLowerCase().trim();
  for (const u of TEMP_UNITS) {
    if (TEMP_ALIASES[u].includes(lower)) return u;
  }
  return null;
}

export function parseInput(input: string): { value: number; unitRaw: string } {
  const trimmed = input.trim();
  // Match: optional sign, digits, optional decimal, then space/nothing, then unit
  // e.g. "100 mph", "30celsius", "-40 F", "5.5 kWh"
  const m = trimmed.match(/^(-?[\d.]+)\s*(.*)$/i);
  if (!m) throw new Error('Enter a value followed by a unit, e.g. "100 mph" or "30 celsius"');
  const value = parseFloat(m[1]);
  if (isNaN(value)) throw new Error('Invalid numeric value');
  const unitRaw = m[2].trim();
  if (!unitRaw) throw new Error('No unit specified. Try "100 km" or "30 celsius"');
  return { value, unitRaw };
}

function convertTable(value: number, fromKey: string, table: UnitTable): ConversionRow[] {
  const base = value * table[fromKey].toBase;
  return Object.entries(table).map(([key, { label, toBase }]) => ({
    unit: key,
    label,
    value: base / toBase,
  }));
}

export function convertUnit(input: string): ConversionResult {
  if (!input.trim()) throw new Error('Input is empty');
  const { value, unitRaw } = parseInput(input);

  // Try each category in order
  const lengthKey = findUnit(unitRaw, LENGTH);
  if (lengthKey) {
    return {
      category: 'length',
      inputValue: value,
      inputUnit: LENGTH[lengthKey].label,
      rows: convertTable(value, lengthKey, LENGTH),
    };
  }

  const massKey = findUnit(unitRaw, MASS);
  if (massKey) {
    return {
      category: 'mass',
      inputValue: value,
      inputUnit: MASS[massKey].label,
      rows: convertTable(value, massKey, MASS),
    };
  }

  const tempUnit = findTempUnit(unitRaw);
  if (tempUnit) {
    const c = toCelsius(value, tempUnit);
    const rows: ConversionRow[] = TEMP_UNITS.map(u => ({
      unit: u,
      label: TEMP_LABELS[u],
      value: fromCelsius(c, u),
    }));
    return {
      category: 'temperature',
      inputValue: value,
      inputUnit: TEMP_LABELS[tempUnit],
      rows,
    };
  }

  const speedKey = findUnit(unitRaw, SPEED);
  if (speedKey) {
    return {
      category: 'speed',
      inputValue: value,
      inputUnit: SPEED[speedKey].label,
      rows: convertTable(value, speedKey, SPEED),
    };
  }

  const pressureKey = findUnit(unitRaw, PRESSURE);
  if (pressureKey) {
    return {
      category: 'pressure',
      inputValue: value,
      inputUnit: PRESSURE[pressureKey].label,
      rows: convertTable(value, pressureKey, PRESSURE),
    };
  }

  const energyKey = findUnit(unitRaw, ENERGY);
  if (energyKey) {
    return {
      category: 'energy',
      inputValue: value,
      inputUnit: ENERGY[energyKey].label,
      rows: convertTable(value, energyKey, ENERGY),
    };
  }

  const powerKey = findUnit(unitRaw, POWER);
  if (powerKey) {
    return {
      category: 'power',
      inputValue: value,
      inputUnit: POWER[powerKey].label,
      rows: convertTable(value, powerKey, POWER),
    };
  }

  throw new Error(
    `Unknown unit "${unitRaw}". Supported categories: length (km, mi, ft...), mass (kg, lb, oz...), temperature (C, F, K, R), speed (mph, kph, m/s...), pressure (Pa, bar, psi, atm...), energy (J, kWh, BTU...), power (W, kW, hp...)`
  );
}

export function convertUnitToText(input: string): string {
  const result = convertUnit(input);
  const catLabel = result.category.charAt(0).toUpperCase() + result.category.slice(1);
  const lines = [
    `Category: ${catLabel}`,
    `Input:    ${result.inputValue} ${result.inputUnit}`,
    '',
    'Conversions:',
    ...result.rows.map(r => {
      const num = Number.isFinite(r.value)
        ? r.value < 0.0001 && r.value !== 0
          ? r.value.toExponential(6)
          : r.value.toPrecision(8).replace(/\.?0+$/, '')
        : '—';
      return `  ${r.label.padEnd(30)} ${num}`;
    }),
  ];
  return lines.join('\n');
}
