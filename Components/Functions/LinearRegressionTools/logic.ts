// Components/Functions/LinearRegressionTools/logic.ts
// Pure logic — no browser APIs.

export interface RegressionResult {
  n: number;
  slope: number;
  intercept: number;
  rSquared: number;
  pearsonR: number;
  meanX: number;
  meanY: number;
  ssxx: number; // sum of (x - meanX)^2
  ssyy: number; // sum of (y - meanY)^2
  ssxy: number; // sum of (x - meanX)(y - meanY)
  residuals: Array<{ x: number; y: number; predicted: number; residual: number }>;
}

/** Parse X,Y pairs — one per line, comma or tab separated. */
export function parsePairs(input: string): { xs: number[]; ys: number[] } {
  const lines = input.split('\n');
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/[\t,]+/);
    if (parts.length < 2) throw new Error('Line ' + (i + 1) + ' must have two values (X and Y), comma separated.');
    const x = parseFloat(parts[0].trim());
    const y = parseFloat(parts[1].trim());
    if (isNaN(x) || isNaN(y)) throw new Error('Invalid number on line ' + (i + 1) + '.');
    xs.push(x);
    ys.push(y);
  }
  if (xs.length < 2) throw new Error('At least 2 data points required.');
  return { xs, ys };
}

function mean(arr: number[]): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

export function computeRegression(xs: number[], ys: number[]): RegressionResult {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);

  let ssxx = 0;
  let ssyy = 0;
  let ssxy = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    ssxx += dx * dx;
    ssyy += dy * dy;
    ssxy += dx * dy;
  }

  const slope = ssxx === 0 ? 0 : ssxy / ssxx;
  const intercept = my - slope * mx;

  const rSquared = (ssxx === 0 || ssyy === 0) ? 0 : (ssxy * ssxy) / (ssxx * ssyy);
  const pearsonR = Math.sqrt(rSquared) * (ssxy >= 0 ? 1 : -1);

  const residuals = xs.map(function(x, i) {
    const predicted = slope * x + intercept;
    return {
      x: x,
      y: ys[i],
      predicted: predicted,
      residual: ys[i] - predicted,
    };
  });

  return {
    n: n,
    slope: slope,
    intercept: intercept,
    rSquared: rSquared,
    pearsonR: pearsonR,
    meanX: mx,
    meanY: my,
    ssxx: ssxx,
    ssyy: ssyy,
    ssxy: ssxy,
    residuals: residuals,
  };
}

function fmt(n: number, d: number): string {
  return n.toFixed(d);
}

function pad(s: string, w: number, right?: boolean): string {
  while (s.length < w) {
    if (right) s = s + ' ';
    else s = ' ' + s;
  }
  return s;
}

export function formatPrediction(result: RegressionResult, xValue: number): string {
  const predicted = result.slope * xValue + result.intercept;
  return 'For X = ' + xValue + ':  Y = ' + fmt(result.slope, 4) + ' × ' + xValue + ' + (' + fmt(result.intercept, 4) + ') = ' + fmt(predicted, 4);
}

export function processLinearRegression(input: string): string {
  // Optional: last line may be "predict: X" or "x=X"
  const rawLines = input.split('\n');
  let predictX: number | null = null;
  const dataLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('predict:') || lower.startsWith('x=') || lower.startsWith('predict ')) {
      const val = parseFloat(trimmed.replace(/.*[:=\s]/, ''));
      if (!isNaN(val)) { predictX = val; continue; }
    }
    dataLines.push(trimmed);
  }

  const { xs, ys } = parsePairs(dataLines.join('\n'));
  const r = computeRegression(xs, ys);

  const sign = r.intercept >= 0 ? '+' : '-';
  const absIntercept = Math.abs(r.intercept);

  const output: string[] = [
    '=== Linear Regression (OLS) ===',
    '',
    'Data Points (n):          ' + r.n,
    '',
    'Regression Equation:      y = ' + fmt(r.slope, 6) + 'x ' + sign + ' ' + fmt(absIntercept, 6),
    '  Slope (m):              ' + fmt(r.slope, 6),
    '  Y-Intercept (b):        ' + fmt(r.intercept, 6),
    '',
    'Goodness of Fit:',
    '  R² (coeff. of det.):    ' + fmt(r.rSquared, 6),
    '  Pearson r:              ' + fmt(r.pearsonR, 6),
    '',
    '=== Step-by-Step Calculation ===',
    '',
    '  Mean of X (x̄):         ' + fmt(r.meanX, 4),
    '  Mean of Y (ȳ):         ' + fmt(r.meanY, 4),
    '  SS_xx = Σ(xᵢ-x̄)²:    ' + fmt(r.ssxx, 4),
    '  SS_yy = Σ(yᵢ-ȳ)²:    ' + fmt(r.ssyy, 4),
    '  SS_xy = Σ(xᵢ-x̄)(yᵢ-ȳ): ' + fmt(r.ssxy, 4),
    '  m = SS_xy / SS_xx:     ' + fmt(r.slope, 6),
    '  b = ȳ - m·x̄:          ' + fmt(r.intercept, 6),
    '  R² = SS_xy² / (SS_xx·SS_yy): ' + fmt(r.rSquared, 6),
    '',
  ];

  if (predictX !== null) {
    output.push('=== Prediction ===');
    output.push('');
    output.push('  ' + formatPrediction(r, predictX));
    output.push('');
  }

  output.push('=== Residuals Table ===');
  output.push('');
  output.push(pad('X', 10, true) + '  ' + pad('Y', 10, true) + '  ' + pad('Predicted', 12, true) + '  ' + pad('Residual', 12, true));
  output.push('-'.repeat(50));

  for (let i = 0; i < r.residuals.length; i++) {
    const row = r.residuals[i];
    output.push(
      pad(fmt(row.x, 4), 10, true) + '  ' +
      pad(fmt(row.y, 4), 10, true) + '  ' +
      pad(fmt(row.predicted, 4), 12, true) + '  ' +
      pad(fmt(row.residual, 4), 12, true)
    );
  }

  return output.join('\n');
}
