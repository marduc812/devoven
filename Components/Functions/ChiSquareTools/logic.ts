// Components/Functions/ChiSquareTools/logic.ts

export interface ChiSquareResult {
  observed: number[];
  expected: number[];
  chiSquare: number;
  df: number;
  pValue: number;
  alpha05: boolean;
  alpha01: boolean;
}

function parseCSV(line: string): number[] {
  return line.split(',').map(function(s) {
    const n = parseFloat(s.trim());
    if (isNaN(n)) throw new Error('Invalid number: "' + s.trim() + '"');
    return n;
  });
}

/**
 * Regularized incomplete gamma function P(a, x) using series expansion.
 * Used to compute the chi-square CDF.
 */
function gammaSeries(a: number, x: number): number {
  if (x <= 0) return 0;
  const maxIter = 200;
  const eps = 1e-10;
  let ap = a;
  let del = 1 / a;
  let sum = del;
  for (let i = 0; i < maxIter; i++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * eps) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/**
 * Continued fraction approximation of complementary regularized
 * incomplete gamma function Q(a, x) = 1 - P(a, x).
 */
function gammaCF(a: number, x: number): number {
  const maxIter = 200;
  const eps = 1e-10;
  const fpMin = 1e-300;
  let b = x + 1 - a;
  let c = 1 / fpMin;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= maxIter; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = b + an / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function logGamma(z: number): number {
  // Lanczos approximation
  const g = 7;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const zz = z - 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (zz + i);
  const t = zz + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Chi-square CDF: P(X <= x) where X ~ chi-square(df).
 */
function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0;
  const a = df / 2;
  if (x < (a + 1)) {
    return gammaSeries(a, x / 2);
  } else {
    return 1 - gammaCF(a, x / 2);
  }
}

export function computeChiSquare(observed: number[], expected: number[] | null): ChiSquareResult {
  const k = observed.length;
  if (k < 2) throw new Error('At least 2 categories required.');

  const exp: number[] = expected !== null ? expected.slice() : [];
  if (expected === null || expected.length === 0) {
    // Uniform distribution
    const total = observed.reduce(function(s, v) { return s + v; }, 0);
    const e = total / k;
    for (let i = 0; i < k; i++) exp.push(e);
  } else {
    if (expected.length !== k) {
      throw new Error('Observed and expected arrays must have the same length.');
    }
  }

  let chi2 = 0;
  for (let i = 0; i < k; i++) {
    if (exp[i] <= 0) throw new Error('Expected frequencies must be positive.');
    const diff = observed[i] - exp[i];
    chi2 += (diff * diff) / exp[i];
  }

  const df = k - 1;
  const pValue = 1 - chiSquareCDF(chi2, df);

  return {
    observed: observed,
    expected: exp,
    chiSquare: chi2,
    df: df,
    pValue: pValue,
    alpha05: pValue < 0.05,
    alpha01: pValue < 0.01,
  };
}

function fmt(n: number, d: number): string {
  return n.toFixed(d);
}

export function processChiSquare(observedLine: string, expectedLine: string): string {
  if (!observedLine.trim()) throw new Error('Observed frequencies are required.');
  const observed = parseCSV(observedLine);
  const expected = expectedLine.trim() ? parseCSV(expectedLine) : null;

  const r = computeChiSquare(observed, expected);

  const rows: string[] = ['Category  Observed  Expected  (O-E)²/E'];
  let check = 0;
  for (let i = 0; i < r.observed.length; i++) {
    const diff = r.observed[i] - r.expected[i];
    const contrib = (diff * diff) / r.expected[i];
    check += contrib;
    rows.push(
      String(i + 1).padStart(8) + '  ' +
      fmt(r.observed[i], 2).padStart(8) + '  ' +
      fmt(r.expected[i], 2).padStart(8) + '  ' +
      fmt(contrib, 4)
    );
  }
  // suppress check warning - it equals chi2

  const lines = [
    rows.join('\n'),
    '',
    'Chi-Square Statistic (χ²): ' + fmt(r.chiSquare, 4),
    'Degrees of Freedom (k-1):  ' + r.df,
    'p-value:                   ' + fmt(r.pValue, 6),
    '',
    'Decision (α = 0.05):  ' + (r.alpha05 ? 'REJECT H₀ — significant difference' : 'Fail to reject H₀ — no significant difference'),
    'Decision (α = 0.01):  ' + (r.alpha01 ? 'REJECT H₀ — significant difference' : 'Fail to reject H₀ — no significant difference'),
  ];

  if (expected === null) {
    lines.push('');
    lines.push('Note: Expected values computed assuming uniform distribution.');
  }

  return lines.join('\n');
}
