// Pure TypeScript — no browser APIs, no React.
// Permutation and combination calculator using logarithms for large values.

export function logFactorial(n: number): number {
  if (n < 0) throw new Error('Factorial undefined for negative numbers');
  if (n === 0 || n === 1) return 0;
  let sum = 0;
  for (let i = 2; i <= n; i++) sum += Math.log10(i);
  return sum;
}

export function factorialExact(n: number): number | null {
  if (n > 18) return null; // too large for safe integer
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// P(n,r) = n! / (n-r)!
export function logPermutation(n: number, r: number): number {
  if (r > n) return -Infinity;
  return logFactorial(n) - logFactorial(n - r);
}

// C(n,r) = n! / (r! * (n-r)!)
export function logCombination(n: number, r: number): number {
  if (r > n) return -Infinity;
  return logFactorial(n) - logFactorial(r) - logFactorial(n - r);
}

function formatResult(logVal: number): string {
  if (!isFinite(logVal)) return '0';
  if (logVal > 15) {
    // Scientific notation
    const exp = Math.floor(logVal);
    const mantissa = Math.pow(10, logVal - exp);
    return `${mantissa.toFixed(4)} × 10^${exp}`;
  }
  return String(Math.round(Math.pow(10, logVal)));
}

export function listCombinations(n: number, r: number): string[][] {
  // Only for small n, r
  if (n > 10 || r > 6 || r > n) return [];
  const items = Array.from({ length: n }, (_, i) => String(i + 1));
  const results: string[][] = [];

  function backtrack(start: number, current: string[]) {
    if (current.length === r) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return results;
}

export function calculatePermComb(input: string): string {
  const parts = input.trim().split(/[\s,]+/);
  if (parts.length < 2) throw new Error('Enter n and r (e.g. "10 3" or "10, 3")');

  const n = parseInt(parts[0], 10);
  const r = parseInt(parts[1], 10);

  if (isNaN(n) || isNaN(r)) throw new Error('n and r must be integers');
  if (n < 0 || r < 0) throw new Error('n and r must be non-negative');
  if (r > n) throw new Error(`r (${r}) cannot be greater than n (${n})`);
  if (n > 1000) throw new Error('n too large (max 1000)');

  const logP = logPermutation(n, r);
  const logC = logCombination(n, r);

  const pStr = formatResult(logP);
  const cStr = formatResult(logC);

  const nFact = n <= 18 ? `${factorialExact(n)}` : `≈ 10^${logFactorial(n).toFixed(2)}`;
  const rFact = r <= 18 ? `${factorialExact(r)}` : `≈ 10^${logFactorial(r).toFixed(2)}`;
  const nrFact = (n - r) <= 18 ? `${factorialExact(n - r)}` : `≈ 10^${logFactorial(n - r).toFixed(2)}`;

  const lines = [
    `n = ${n},  r = ${r}`,
    '',
    `P(n,r) — Permutations (ordered):`,
    `  Formula: n! / (n-r)! = ${n}! / ${n - r}!`,
    `  = ${nFact} / ${nrFact}`,
    `  P(${n}, ${r}) = ${pStr}`,
    '',
    `C(n,r) — Combinations (unordered):`,
    `  Formula: n! / (r! × (n-r)!) = ${n}! / (${r}! × ${n - r}!)`,
    `  = ${nFact} / (${rFact} × ${nrFact})`,
    `  C(${n}, ${r}) = ${cStr}`,
    '',
    `Relationship: P(n,r) = C(n,r) × r! = ${cStr} × ${r <= 18 ? factorialExact(r) : `≈ 10^${logFactorial(r).toFixed(2)}`}`,
  ];

  const combos = listCombinations(n, r);
  if (combos.length > 0) {
    lines.push('');
    const shown = combos.slice(0, 10);
    lines.push(`First ${shown.length} combinations of {1..${n}} choose ${r}:`);
    shown.forEach((c, i) => lines.push(`  ${i + 1}. {${c.join(', ')}}`));
    if (combos.length > 10) lines.push(`  … (${combos.length} total)`);
  }

  return lines.join('\n');
}

// ─── Exact arithmetic ────────────────────────────────────────────────────────
// The log-based helpers above are kept for the string output, but they cannot
// be trusted for a printed integer: round-tripping through log10 loses the low
// digits, so C(50,25) came back as 126410606437748 when it is 126410606437752.
// Everything the UI shows goes through BigInt instead.

export const MAX_N = 1000;

// The project targets ES2015, where BigInt *literals* (0n, 1n) are a syntax
// error even though the BigInt runtime is available — so use BigInt() instead.
// Same convention as BaseConvertTools.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);

export function factorialBig(n: number): bigint {
  if (n < 0) throw new Error('Factorial undefined for negative numbers');
  let result = ONE;
  for (let i = TWO; i <= BigInt(n); i++) result *= i;
  return result;
}

/** P(n,r) = n × (n−1) × … × (n−r+1). Zero when r > n. */
export function permutationsBig(n: number, r: number): bigint {
  if (r > n) return ZERO;
  let result = ONE;
  for (let i = ZERO; i < BigInt(r); i++) result *= BigInt(n) - i;
  return result;
}

/** C(n,r) via the multiplicative formula. Every intermediate division is exact
 *  because the product of any k consecutive integers divides k!. */
export function combinationsBig(n: number, r: number): bigint {
  if (r > n) return ZERO;
  const k = Math.min(r, n - r); // C(n,r) = C(n,n−r); the smaller loop is exact either way
  let result = ONE;
  for (let i = ZERO; i < BigInt(k); i++) {
    result = (result * (BigInt(n) - i)) / (i + ONE);
  }
  return result;
}

/** Ordered, with repetition: n^r. Written as a loop because ** on bigint also
 *  needs a later target than this project compiles to. */
export function tuplesBig(n: number, r: number): bigint {
  let result = ONE;
  const base = BigInt(n);
  for (let i = 0; i < r; i++) result *= base;
  return result;
}

/** Unordered, with repetition (multiset coefficient): C(n+r−1, r). */
export function multisetsBig(n: number, r: number): bigint {
  if (r === 0) return ONE;
  if (n === 0) return ZERO;
  return combinationsBig(n + r - 1, r);
}

export interface BigDisplay {
  /** Digit-grouped exact value, or null when it is too long to read. */
  exact: string | null;
  /** Always available: the value in scientific notation. */
  approx: string;
  digits: number;
  /** The full digit string, for copying. */
  raw: string;
}

const EXACT_DIGIT_LIMIT = 30;

export function formatBig(value: bigint): BigDisplay {
  const raw = value.toString();
  const negative = raw.startsWith('-');
  const body = negative ? raw.slice(1) : raw;
  const digits = body.length;

  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const exact = digits <= EXACT_DIGIT_LIMIT ? (negative ? `-${grouped}` : grouped) : null;

  let approx: string;
  if (digits <= 6) {
    approx = raw;
  } else {
    const mantissa = `${body[0]}.${body.slice(1, 5)}`;
    approx = `${negative ? '-' : ''}${mantissa} × 10^${digits - 1}`;
  }

  return { exact, approx, digits, raw };
}

// ─── Listings ────────────────────────────────────────────────────────────────

/** Combinations of {1..n} taken r at a time, capped at `limit` items. */
export function listCombinationsOf(n: number, r: number, limit: number): number[][] {
  const out: number[][] = [];
  if (r > n || r < 0) return out;
  const current: number[] = [];

  const walk = (start: number) => {
    if (out.length >= limit) return;
    if (current.length === r) {
      out.push([...current]);
      return;
    }
    for (let i = start; i <= n; i++) {
      if (out.length >= limit) return;
      current.push(i);
      walk(i + 1);
      current.pop();
    }
  };

  walk(1);
  return out;
}

/** Permutations of {1..n} taken r at a time, in lexicographic order. */
export function listPermutationsOf(n: number, r: number, limit: number): number[][] {
  const out: number[][] = [];
  if (r > n || r < 0) return out;
  const current: number[] = [];
  const used = new Array(n + 1).fill(false);

  const walk = () => {
    if (out.length >= limit) return;
    if (current.length === r) {
      out.push([...current]);
      return;
    }
    for (let i = 1; i <= n; i++) {
      if (used[i]) continue;
      if (out.length >= limit) return;
      used[i] = true;
      current.push(i);
      walk();
      current.pop();
      used[i] = false;
    }
  };

  walk();
  return out;
}

// ─── Structured report ───────────────────────────────────────────────────────

export type CountingKey = 'permutations' | 'combinations' | 'tuples' | 'multisets';

export interface CountingCase {
  key: CountingKey;
  label: string;
  formula: string;
  /** Does the order of the chosen items matter? */
  ordered: boolean;
  /** May an item be chosen more than once? */
  repetition: boolean;
  value: bigint;
  display: BigDisplay;
  example: string;
}

export interface PermCombReport {
  n: number;
  r: number;
  cases: CountingCase[];
  /** r! — the factor between P(n,r) and C(n,r). */
  rFactorial: bigint;
  factorials: { n: BigDisplay; r: BigDisplay; nMinusR: BigDisplay | null };
  /** C(n,k) for every k from 0 to n, when n is small enough to draw. */
  distribution: { k: number; value: bigint }[] | null;
  /** Actual tuples, when the count is small enough to list. */
  listing: { combinations: number[][]; permutations: number[][]; truncated: boolean } | null;
  notes: string[];
}

const LISTING_LIMIT = 120;
const DISTRIBUTION_MAX_N = 40;

export function parsePermCombInput(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '') throw new Error('Enter a whole number');
  if (!/^\d+$/.test(trimmed)) throw new Error(`"${raw}" is not a whole number`);
  return parseInt(trimmed, 10);
}

export function analyzePermComb(n: number, r: number): PermCombReport {
  if (!Number.isInteger(n) || !Number.isInteger(r)) throw new Error('n and r must be integers');
  if (n < 0 || r < 0) throw new Error('n and r must be non-negative');
  if (n > MAX_N) throw new Error(`n too large (max ${MAX_N})`);
  if (r > MAX_N) throw new Error(`r too large (max ${MAX_N})`);

  const notes: string[] = [];
  if (r > n) {
    notes.push(
      `r is larger than n, so there is no way to pick ${r} distinct items from ${n} — the two "no repetition" counts are 0. The repetition counts are still defined.`
    );
  }

  const permutations = permutationsBig(n, r);
  const combinations = combinationsBig(n, r);

  const cases: CountingCase[] = [
    {
      key: 'permutations',
      label: 'Ordered, no repetition',
      formula: 'P(n,r) = n! / (n−r)!',
      ordered: true,
      repetition: false,
      value: permutations,
      display: formatBig(permutations),
      example: 'Podium finishes — gold, silver, bronze from the same field',
    },
    {
      key: 'combinations',
      label: 'Unordered, no repetition',
      formula: 'C(n,r) = n! / (r! (n−r)!)',
      ordered: false,
      repetition: false,
      value: combinations,
      display: formatBig(combinations),
      example: 'A lottery draw, or a hand of cards',
    },
    {
      key: 'tuples',
      label: 'Ordered, with repetition',
      formula: 'nʳ',
      ordered: true,
      repetition: true,
      value: tuplesBig(n, r),
      display: formatBig(tuplesBig(n, r)),
      example: 'A PIN — each position independently picks any of the n symbols',
    },
    {
      key: 'multisets',
      label: 'Unordered, with repetition',
      formula: 'C(n+r−1, r)',
      ordered: false,
      repetition: true,
      value: multisetsBig(n, r),
      display: formatBig(multisetsBig(n, r)),
      example: 'Scoops of ice cream — you may take the same flavour twice',
    },
  ];

  const distribution =
    n <= DISTRIBUTION_MAX_N
      ? Array.from({ length: n + 1 }, (_, k) => ({ k, value: combinationsBig(n, k) }))
      : null;

  let listing: PermCombReport['listing'] = null;
  if (r <= n && combinations > ZERO && combinations <= BigInt(LISTING_LIMIT * 4)) {
    const combos = listCombinationsOf(n, r, LISTING_LIMIT);
    const perms = listPermutationsOf(n, r, LISTING_LIMIT);
    listing = {
      combinations: combos,
      permutations: perms,
      truncated: combinations > BigInt(LISTING_LIMIT) || permutations > BigInt(LISTING_LIMIT),
    };
  }

  return {
    n,
    r,
    cases,
    rFactorial: factorialBig(r),
    factorials: {
      n: formatBig(factorialBig(n)),
      r: formatBig(factorialBig(r)),
      nMinusR: r <= n ? formatBig(factorialBig(n - r)) : null,
    },
    distribution,
    listing,
    notes,
  };
}
