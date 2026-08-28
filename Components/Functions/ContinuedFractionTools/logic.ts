export interface Convergent {
  step: number;
  a: number;
  p: number;
  q: number;
  decimal: string;
  error: string;
}

export interface ContinuedFractionResult {
  coefficients: number[];
  notation: string;
  convergents: Convergent[];
  inputDecimal: number;
  isRational: boolean;
}

/**
 * Parse input as either a decimal number or a fraction like "22/7"
 */
export function parseInput(input: string): number {
  const trimmed = input.trim();
  const fractionMatch = trimmed.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den === 0) throw new Error('Denominator cannot be zero');
    return num / den;
  }
  const val = parseFloat(trimmed);
  if (isNaN(val)) throw new Error('Invalid input. Enter a decimal (e.g. 3.14159) or fraction (e.g. 22/7)');
  return val;
}

/**
 * Compute continued fraction coefficients for a number.
 * maxTerms limits the expansion.
 */
export function computeContinuedFraction(x: number, maxTerms: number): number[] {
  const coeffs: number[] = [];
  let remaining = x;
  for (let i = 0; i < maxTerms; i++) {
    const a = Math.floor(remaining);
    coeffs.push(a);
    const frac = remaining - a;
    if (Math.abs(frac) < 1e-10) break;
    remaining = 1 / frac;
    if (!isFinite(remaining) || isNaN(remaining)) break;
  }
  return coeffs;
}

/**
 * Compute convergents (p/q rational approximations) from CF coefficients.
 */
export function computeConvergents(coeffs: number[], original: number): Convergent[] {
  const convergents: Convergent[] = [];
  let pPrev = 1, pCurr = coeffs[0];
  let qPrev = 0, qCurr = 1;

  for (let i = 0; i < coeffs.length; i++) {
    const a = coeffs[i];
    if (i === 0) {
      pCurr = a;
      qCurr = 1;
    } else {
      const pNext = a * pCurr + pPrev;
      const qNext = a * qCurr + qPrev;
      pPrev = pCurr;
      qPrev = qCurr;
      pCurr = pNext;
      qCurr = qNext;
    }
    const approx = pCurr / qCurr;
    const err = Math.abs(original - approx);
    convergents.push({
      step: i,
      a,
      p: pCurr,
      q: qCurr,
      decimal: approx.toFixed(10),
      error: err < 1e-15 ? '0' : err.toExponential(3),
    });
  }
  return convergents;
}

/**
 * Format coefficients as standard continued fraction notation [a0; a1, a2, ...]
 */
export function formatNotation(coeffs: number[]): string {
  if (coeffs.length === 0) return '[]';
  if (coeffs.length === 1) return `[${coeffs[0]}]`;
  return `[${coeffs[0]}; ${coeffs.slice(1).join(', ')}]`;
}

const FAMOUS_CONSTANTS: Array<{ name: string; value: number; cf: string }> = [
  { name: 'π (pi)', value: Math.PI, cf: '[3; 7, 15, 1, 292, 1, 1, 1, 2, ...]' },
  { name: 'e (Euler)', value: Math.E, cf: '[2; 1, 2, 1, 1, 4, 1, 1, 6, 1, ...]' },
  { name: '√2', value: Math.SQRT2, cf: '[1; 2, 2, 2, 2, 2, ...]' },
  { name: 'φ (golden ratio)', value: (1 + Math.sqrt(5)) / 2, cf: '[1; 1, 1, 1, 1, 1, ...]' },
];

export function famousConstantsText(): string {
  const lines = ['Famous Constants:', ''];
  for (const c of FAMOUS_CONSTANTS) {
    lines.push(`  ${c.name.padEnd(20)} ≈ ${c.value.toFixed(10)}`);
    lines.push(`  CF notation: ${c.cf}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function computeContinuedFractionResult(input: string): string {
  if (!input.trim()) return '';
  const x = parseInput(input.trim());
  const maxTerms = 20;
  const coeffs = computeContinuedFraction(Math.abs(x), maxTerms);
  const isNeg = x < 0;
  const notation = (isNeg ? '-' : '') + formatNotation(coeffs);
  const convergents = computeConvergents(coeffs, Math.abs(x));

  const lines: string[] = [];
  lines.push(`Input:        ${x}`);
  lines.push(`CF notation:  ${notation}`);
  lines.push(`Terms:        ${coeffs.length}`);
  lines.push('');
  lines.push('Convergents (rational approximations):');
  lines.push('  Step  a    p/q                  Decimal               Error');
  lines.push('  ' + '-'.repeat(70));
  for (const cv of convergents) {
    const pq = `${cv.p}/${cv.q}`;
    lines.push(
      `  ${String(cv.step).padEnd(5)} ${String(cv.a).padEnd(4)} ${pq.padEnd(20)} ${cv.decimal.padEnd(21)} ${cv.error}`
    );
  }
  lines.push('');
  lines.push(famousConstantsText());
  return lines.join('\n');
}
