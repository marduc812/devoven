export type SupportedFunction = 'sin' | 'cos' | 'exp' | 'ln1p' | 'geometric' | 'arctan';

export interface TermResult {
  terms: number;
  approximation: number;
  error: number;
  relativeError: number;
}

export interface TaylorResult {
  fn: SupportedFunction;
  x: number;
  exact: number;
  termResults: TermResult[];
  series: string;
  formatted: string;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// Compute partial sum of Taylor series for each function
export function computePartialSum(fn: SupportedFunction, x: number, terms: number): number {
  let sum = 0;
  for (let n = 0; n < terms; n++) {
    switch (fn) {
      case 'sin':
        // sin(x) = sum (-1)^n * x^(2n+1) / (2n+1)!
        sum += Math.pow(-1, n) * Math.pow(x, 2 * n + 1) / factorial(2 * n + 1);
        break;
      case 'cos':
        // cos(x) = sum (-1)^n * x^(2n) / (2n)!
        sum += Math.pow(-1, n) * Math.pow(x, 2 * n) / factorial(2 * n);
        break;
      case 'exp':
        // e^x = sum x^n / n!
        sum += Math.pow(x, n) / factorial(n);
        break;
      case 'ln1p':
        // ln(1+x) = sum (-1)^(n+1) * x^n / n  for n>=1
        if (n === 0) break;
        sum += Math.pow(-1, n + 1) * Math.pow(x, n) / n;
        break;
      case 'geometric':
        // 1/(1-x) = sum x^n
        sum += Math.pow(x, n);
        break;
      case 'arctan':
        // arctan(x) = sum (-1)^n * x^(2n+1) / (2n+1)
        sum += Math.pow(-1, n) * Math.pow(x, 2 * n + 1) / (2 * n + 1);
        break;
    }
  }
  return sum;
}

export function exactValue(fn: SupportedFunction, x: number): number {
  switch (fn) {
    case 'sin': return Math.sin(x);
    case 'cos': return Math.cos(x);
    case 'exp': return Math.exp(x);
    case 'ln1p': return Math.log(1 + x);
    case 'geometric': return 1 / (1 - x);
    case 'arctan': return Math.atan(x);
  }
}

export function seriesFormula(fn: SupportedFunction): string {
  switch (fn) {
    case 'sin': return 'sin(x) = x - x³/3! + x⁵/5! - x⁷/7! + ...';
    case 'cos': return 'cos(x) = 1 - x²/2! + x⁴/4! - x⁶/6! + ...';
    case 'exp': return 'eˣ = 1 + x + x²/2! + x³/3! + x⁴/4! + ...';
    case 'ln1p': return 'ln(1+x) = x - x²/2 + x³/3 - x⁴/4 + ...';
    case 'geometric': return '1/(1-x) = 1 + x + x² + x³ + x⁴ + ...';
    case 'arctan': return 'arctan(x) = x - x³/3 + x⁵/5 - x⁷/7 + ...';
  }
}

export function computeTaylor(fnName: string, xStr: string): TaylorResult {
  const supported: SupportedFunction[] = ['sin', 'cos', 'exp', 'ln1p', 'geometric', 'arctan'];
  const fn = fnName.trim().toLowerCase() as SupportedFunction;
  if (!supported.includes(fn)) {
    throw new Error('Unknown function. Supported: sin, cos, exp, ln1p, geometric, arctan');
  }
  const x = parseFloat(xStr);
  if (isNaN(x)) throw new Error('x must be a valid number');

  if (fn === 'ln1p' && x <= -1) throw new Error('ln(1+x) requires x > -1');
  if (fn === 'geometric' && Math.abs(x) >= 1) throw new Error('1/(1-x) series requires |x| < 1');

  const exact = exactValue(fn, x);
  const termCounts = [1, 2, 3, 5, 10, 20];

  const termResults: TermResult[] = termCounts.map(terms => {
    const approx = computePartialSum(fn, x, terms);
    const error = Math.abs(exact - approx);
    const relErr = Math.abs(exact) > 1e-15 ? error / Math.abs(exact) : error;
    return { terms, approximation: approx, error, relativeError: relErr };
  });

  // Format output
  const lines: string[] = [
    `Function:    ${fn}(x) at x = ${x}`,
    `Formula:     ${seriesFormula(fn)}`,
    ``,
    `Exact value: ${exact}`,
    ``,
    `Terms  Approximation                  Absolute Error         Relative Error`,
    `------ ------------------------------ ---------------------- ----------------------`,
  ];

  for (const r of termResults) {
    const approxStr = r.approximation.toPrecision(12).padEnd(30);
    const errStr = r.error.toExponential(4).padEnd(22);
    const relStr = r.relativeError.toExponential(4);
    lines.push(`${String(r.terms).padEnd(6)} ${approxStr} ${errStr} ${relStr}`);
  }

  lines.push('');
  lines.push('Convergence: The series converges to the exact value as more terms are added.');

  return {
    fn,
    x,
    exact,
    termResults,
    series: seriesFormula(fn),
    formatted: lines.join('\n'),
  };
}

export function formatTaylor(fnName: string, xStr: string): string {
  return computeTaylor(fnName, xStr).formatted;
}

export const SUPPORTED_FUNCTIONS: { value: SupportedFunction; label: string }[] = [
  { value: 'sin', label: 'sin(x)' },
  { value: 'cos', label: 'cos(x)' },
  { value: 'exp', label: 'eˣ' },
  { value: 'ln1p', label: 'ln(1+x)' },
  { value: 'geometric', label: '1/(1-x)' },
  { value: 'arctan', label: 'arctan(x)' },
];

/** The most terms the calculator will sum; beyond this the factorials stop paying off. */
export const MAX_TERMS = 20;

export type FunctionMeta = {
  value: SupportedFunction;
  label: string;
  formula: string;
  /** Where the series converges, in words. */
  convergence: string;
  /** A plotting and slider window that keeps the interesting behaviour on screen. */
  domain: [number, number];
};

export const FUNCTION_META: Record<SupportedFunction, FunctionMeta> = {
  sin: {
    value: 'sin', label: 'sin(x)', formula: seriesFormula('sin'),
    convergence: 'converges for every x, but needs more terms the further you go from 0',
    domain: [-2 * Math.PI, 2 * Math.PI],
  },
  cos: {
    value: 'cos', label: 'cos(x)', formula: seriesFormula('cos'),
    convergence: 'converges for every x, but needs more terms the further you go from 0',
    domain: [-2 * Math.PI, 2 * Math.PI],
  },
  exp: {
    value: 'exp', label: 'eˣ', formula: seriesFormula('exp'),
    convergence: 'converges for every x; growth makes large x expensive',
    domain: [-3, 3],
  },
  ln1p: {
    value: 'ln1p', label: 'ln(1+x)', formula: seriesFormula('ln1p'),
    convergence: 'converges only for −1 < x ≤ 1, and slowly near the ends',
    domain: [-0.95, 1.5],
  },
  geometric: {
    value: 'geometric', label: '1/(1-x)', formula: seriesFormula('geometric'),
    convergence: 'converges only for |x| < 1; outside that it diverges outright',
    domain: [-0.95, 0.95],
  },
  arctan: {
    value: 'arctan', label: 'arctan(x)', formula: seriesFormula('arctan'),
    convergence: 'converges for |x| ≤ 1; beyond 1 the partial sums swing wildly',
    domain: [-2, 2],
  },
};

export type SeriesTerm = { index: number; value: number; partial: number };

/**
 * What each successive term adds. Derived from the partial sums so the numbering
 * always lines up with the "N terms" figures, including ln(1+x) whose first
 * loop pass contributes nothing.
 */
export function termValues(fn: SupportedFunction, x: number, count: number): SeriesTerm[] {
  const out: SeriesTerm[] = [];
  let prev = 0;
  for (let n = 1; n <= count; n++) {
    const partial = computePartialSum(fn, x, n);
    out.push({ index: n, value: partial - prev, partial });
    prev = partial;
  }
  return out;
}
