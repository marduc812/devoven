// Ohm's Law Calculator — pure logic, no browser APIs

export type OhmsValues = {
  V: number | null;
  I: number | null;
  R: number | null;
  P: number | null;
};

export type OhmsResult = {
  V: number;
  I: number;
  R: number;
  P: number;
  resistorColorCode: string[] | null;
  resistorDisplay: string;
};

/** Parse a value string like "12V", "2A", "100R", "1.5k", "4.7kΩ", etc.
 *  Returns value in SI base units (V, A, Ω, W).
 */
/** SI prefixes, matched case-sensitively where SI is: M is mega and m is milli.
 *  k/K and G/g are both accepted because neither has a conflicting meaning
 *  here, and µ (U+00B5, the sign Windows types) is accepted alongside μ. */
const SI_MULTIPLIERS: Record<string, number> = {
  '': 1,
  G: 1e9,
  g: 1e9,
  M: 1e6,
  k: 1e3,
  K: 1e3,
  m: 1e-3,
  u: 1e-6,
  μ: 1e-6,
  'µ': 1e-6,
  n: 1e-9,
};

export function parseElectricalValue(raw: string): number {
  const s = raw.trim();
  // A number, an optional SI prefix, then any trailing unit spelling
  // (V, A, W, R, Ω, ohm) which carries no information we need.
  const unitlessMatch = s.match(
    /^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*([kKmMuμµGgn]?)\s*(?:[VAWRΩohmOHM]*)$/
  );
  if (!unitlessMatch) throw new Error(`Cannot parse "${raw}"`);

  const num = parseFloat(unitlessMatch[1]);
  if (isNaN(num)) throw new Error(`Not a number: "${raw}"`);

  return num * (SI_MULTIPLIERS[unitlessMatch[2]] ?? 1);
}

/** Parse key=value pairs from multi-line input.
 *  Accepted keys: V, I, R, P (case-insensitive).
 *  Returns OhmsValues with at least 2 non-null fields.
 */
export function parseOhmsInput(input: string): OhmsValues {
  const result: OhmsValues = { V: null, I: null, R: null, P: null };
  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim().toUpperCase();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key === 'V') result.V = parseElectricalValue(val);
    else if (key === 'I') result.I = parseElectricalValue(val);
    else if (key === 'R') result.R = parseElectricalValue(val);
    else if (key === 'P') result.P = parseElectricalValue(val);
  }
  return result;
}

/** Count how many of V, I, R, P are non-null. */
function countKnown(v: OhmsValues): number {
  let n = 0;
  if (v.V !== null) n++;
  if (v.I !== null) n++;
  if (v.R !== null) n++;
  if (v.P !== null) n++;
  return n;
}

/** Solve Ohm's Law given any two known values. Returns all four solved values. */
export function solveOhmsLaw(known: OhmsValues): OhmsResult {
  const k = countKnown(known);
  if (k < 2) throw new Error('Provide at least two values (e.g., V=12, I=2A)');

  let V = known.V;
  let I = known.I;
  let R = known.R;
  let P = known.P;

  // Solve using V=IR, P=VI=I²R=V²/R
  // We attempt different combinations

  // V and I known
  if (V !== null && I !== null) {
    R = R !== null ? R : V / I;
    P = P !== null ? P : V * I;
  }
  // V and R known
  else if (V !== null && R !== null) {
    I = I !== null ? I : V / R;
    P = P !== null ? P : (V * V) / R;
  }
  // V and P known
  else if (V !== null && P !== null) {
    I = I !== null ? I : P / V;
    R = R !== null ? R : (V * V) / P;
  }
  // I and R known
  else if (I !== null && R !== null) {
    V = V !== null ? V : I * R;
    P = P !== null ? P : I * I * R;
  }
  // I and P known
  else if (I !== null && P !== null) {
    V = V !== null ? V : P / I;
    R = R !== null ? R : P / (I * I);
  }
  // R and P known
  else if (R !== null && P !== null) {
    V = V !== null ? V : Math.sqrt(P * R);
    I = I !== null ? I : Math.sqrt(P / R);
  }

  if (V === null || I === null || R === null || P === null) {
    throw new Error('Could not solve — check your inputs');
  }

  const colorCode = getResistorColorCode(R);

  return {
    V,
    I,
    R,
    P,
    resistorColorCode: colorCode,
    resistorDisplay: colorCode ? colorCode.join(', ') : 'N/A (out of standard range)',
  };
}

// ─── Resistor color code (shared with ResistorColorTools) ────────────────────

const COLOR_NAMES = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];

/** Get the 4-band color code for a resistance value.
 *  Returns null if value is out of the representable range.
 */
export function getResistorColorCode(ohms: number): string[] | null {
  if (ohms <= 0 || !isFinite(ohms)) return null;

  // Find multiplier such that significand is between 10 and 99
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const multiplierVal = Math.pow(10, exp);
  const significand = Math.round(ohms / multiplierVal);

  if (significand < 10 || significand > 99) return null;

  const digit1 = Math.floor(significand / 10);
  const digit2 = significand % 10;

  if (exp < -2 || exp > 9) return null;
  if (digit1 < 0 || digit1 > 9 || digit2 < 0 || digit2 > 9) return null;

  // multiplier band
  const multIdx = exp + 2; // maps -2→0(silver), -1→1(gold), 0→2(black), ...
  // Standard multipliers: silver=0.01, gold=0.1, black=1, brown=10, ...
  const MULTIPLIER_BANDS = [
    'silver', 'gold',
    'black', 'brown', 'red', 'orange', 'yellow',
    'green', 'blue', 'violet', 'grey', 'white',
  ];

  if (multIdx < 0 || multIdx >= MULTIPLIER_BANDS.length) return null;

  return [
    COLOR_NAMES[digit1],
    COLOR_NAMES[digit2],
    MULTIPLIER_BANDS[multIdx],
    'gold', // default ±5% tolerance
  ];
}

export function formatEngineering(value: number, unit: string): string {
  const abs = Math.abs(value);
  if (abs === 0) return `0 ${unit}`;

  const prefixes: Array<[number, string]> = [
    [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'],
    [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'],
  ];

  for (const [divisor, prefix] of prefixes) {
    if (abs >= divisor) {
      const scaled = value / divisor;
      const formatted = parseFloat(scaled.toPrecision(4)).toString();
      return `${formatted} ${prefix}${unit}`;
    }
  }
  return `${value.toExponential(3)} ${unit}`;
}

// ─── Structured report ───────────────────────────────────────────────────────
// solveOhmsLaw above returns the four numbers; this adds what the UI needs on
// top — which values were given, which identity produced each derived one, and
// whether an over-specified input contradicts itself.

export type OhmsQuantity = 'V' | 'I' | 'R' | 'P';

export const QUANTITY_META: Record<OhmsQuantity, { name: string; unit: string; unitName: string }> = {
  V: { name: 'Voltage', unit: 'V', unitName: 'volts' },
  I: { name: 'Current', unit: 'A', unitName: 'amperes' },
  R: { name: 'Resistance', unit: 'Ω', unitName: 'ohms' },
  P: { name: 'Power', unit: 'W', unitName: 'watts' },
};

/** The twelve identities of the Ohm's law wheel, keyed by what they produce. */
export const OHMS_FORMULAS: Record<OhmsQuantity, string[]> = {
  V: ['V = I × R', 'V = P / I', 'V = √(P × R)'],
  I: ['I = V / R', 'I = P / V', 'I = √(P / R)'],
  R: ['R = V / I', 'R = V² / P', 'R = P / I²'],
  P: ['P = V × I', 'P = V² / R', 'P = I² × R'],
};

export interface SolvedQuantity {
  key: OhmsQuantity;
  name: string;
  unit: string;
  value: number;
  formatted: string;
  /** True when the user supplied it rather than the solver deriving it. */
  given: boolean;
  /** The identity used, or null when it was given. */
  formula: string | null;
}

export interface ResistorBand {
  color: string;
  role: string;
  meaning: string;
}

export interface OhmsReport {
  quantities: SolvedQuantity[];
  V: number;
  I: number;
  R: number;
  P: number;
  givenKeys: OhmsQuantity[];
  bands: ResistorBand[] | null;
  /** Nearest E24 preferred resistor value, so the figure maps to a real part. */
  e24: { value: number; formatted: string; errorPercent: number } | null;
  notes: string[];
}

/** Which identity the solver reaches for, given exactly which pair is known. */
const DERIVATION: Record<string, Partial<Record<OhmsQuantity, string>>> = {
  VI: { R: 'R = V / I', P: 'P = V × I' },
  VR: { I: 'I = V / R', P: 'P = V² / R' },
  VP: { I: 'I = P / V', R: 'R = V² / P' },
  IR: { V: 'V = I × R', P: 'P = I² × R' },
  IP: { V: 'V = P / I', R: 'R = P / I²' },
  RP: { V: 'V = √(P × R)', I: 'I = √(P / R)' },
};

const ORDER: OhmsQuantity[] = ['V', 'I', 'R', 'P'];

/** The E24 series — the preferred values real 5% resistors are made in. */
export const E24_SERIES = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

export function nearestE24(ohms: number): { value: number; errorPercent: number } | null {
  if (!isFinite(ohms) || ohms <= 0) return null;
  const decade = Math.pow(10, Math.floor(Math.log10(ohms)));
  let best = E24_SERIES[0] * decade;
  let bestError = Infinity;
  // The decade below and above are both candidates: 9.5 is nearer 9.1 than 10,
  // but 9.6 is nearer 10 — which lives in the next decade up.
  for (const factor of [decade / 10, decade, decade * 10]) {
    for (const step of E24_SERIES) {
      const candidate = step * factor;
      const error = Math.abs(candidate - ohms) / ohms;
      if (error < bestError) {
        bestError = error;
        best = candidate;
      }
    }
  }
  return { value: best, errorPercent: bestError * 100 };
}

const BAND_ROLES = ['1st digit', '2nd digit', 'Multiplier', 'Tolerance'];

const MULTIPLIER_MEANING: Record<string, string> = {
  silver: '× 0.01', gold: '× 0.1', black: '× 1', brown: '× 10', red: '× 100',
  orange: '× 1k', yellow: '× 10k', green: '× 100k', blue: '× 1M',
  violet: '× 10M', grey: '× 100M', white: '× 1G',
};

const DIGIT_MEANING: Record<string, string> = {
  black: '0', brown: '1', red: '2', orange: '3', yellow: '4',
  green: '5', blue: '6', violet: '7', grey: '8', white: '9',
};

export function describeBands(colors: string[]): ResistorBand[] {
  return colors.map((color, i) => ({
    color,
    role: BAND_ROLES[i] ?? `Band ${i + 1}`,
    meaning:
      i < 2 ? DIGIT_MEANING[color] ?? '?'
      : i === 2 ? MULTIPLIER_MEANING[color] ?? '?'
      : '± 5%',
  }));
}

/** How far apart two figures are, as a fraction of the larger. */
const relativeGap = (a: number, b: number) => {
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return scale === 0 ? 0 : Math.abs(a - b) / scale;
};

/** Everything the UI renders. Throws when fewer than two values are known. */
export function analyzeOhms(known: OhmsValues): OhmsReport {
  const givenKeys = ORDER.filter(k => known[k] !== null);
  if (givenKeys.length < 2) {
    throw new Error('Enter at least two of V, I, R and P — the other two follow.');
  }

  const notes: string[] = [];

  // solveOhmsLaw takes the first pair it recognises, so the pair driving the
  // derivation is the first two in V, I, R, P order.
  const drivingPair = givenKeys.slice(0, 2).join('');
  const solved = solveOhmsLaw(known);
  const derivations = DERIVATION[drivingPair] ?? {};

  const quantities: SolvedQuantity[] = ORDER.map(key => {
    const given = known[key] !== null;
    return {
      key,
      name: QUANTITY_META[key].name,
      unit: QUANTITY_META[key].unit,
      value: solved[key],
      formatted: formatEngineering(solved[key], QUANTITY_META[key].unit),
      given,
      formula: given ? null : derivations[key] ?? null,
    };
  });

  for (const q of quantities) {
    if (!isFinite(q.value)) {
      notes.push(`${q.name} came out as ${q.value > 0 ? 'infinite' : 'undefined'} — check for a zero input.`);
    } else if (q.value < 0) {
      notes.push(`${q.name} is negative, which usually means one of the inputs has the wrong sign.`);
    }
  }

  // With three or more values given the input can contradict itself; the solver
  // silently keeps whatever was typed, so say so rather than hiding it.
  if (givenKeys.length > 2) {
    const checks: [string, number, number][] = [
      ['V = I × R', solved.V, solved.I * solved.R],
      ['P = V × I', solved.P, solved.V * solved.I],
    ];
    for (const [identity, lhs, rhs] of checks) {
      if (isFinite(lhs) && isFinite(rhs) && relativeGap(lhs, rhs) > 0.005) {
        notes.push(
          `The values you gave do not satisfy ${identity} (${formatEngineering(lhs, '')} vs ${formatEngineering(rhs, '')}). Remove one to let it be solved for.`
        );
      }
    }
  }

  const bands = solved.resistorColorCode ? describeBands(solved.resistorColorCode) : null;
  const e24Match = nearestE24(solved.R);

  return {
    quantities,
    V: solved.V,
    I: solved.I,
    R: solved.R,
    P: solved.P,
    givenKeys,
    bands,
    e24: e24Match
      ? {
          value: e24Match.value,
          formatted: formatEngineering(e24Match.value, 'Ω'),
          errorPercent: e24Match.errorPercent,
        }
      : null,
    notes,
  };
}
