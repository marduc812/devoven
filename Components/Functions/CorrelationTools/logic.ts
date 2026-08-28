// Components/Functions/CorrelationTools/logic.ts

export interface CorrelationResult {
  n: number;
  pearsonR: number;
  rSquared: number;
  interpretation: string;
  slope: number;
  intercept: number;
  spearmanR: number;
}

/** Parse two-column input: comma/tab separated pairs, one per line. */
export function parseTwoColumns(input: string): { xs: number[]; ys: number[] } {
  const lines = input.split('\n');
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/[\t,]+/);
    if (parts.length < 2) throw new Error('Line ' + (i + 1) + ' must have two values (x and y).');
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

function rankArray(arr: number[]): number[] {
  const n = arr.length;
  const indexed = arr.map(function(v, i) { return { v: v, i: i }; });
  indexed.sort(function(a, b) { return a.v - b.v; });
  const ranks = new Array(n);
  let j = 0;
  while (j < n) {
    let k = j;
    while (k < n - 1 && indexed[k + 1].v === indexed[k].v) k++;
    const avgRank = (j + k) / 2 + 1;
    for (let m = j; m <= k; m++) ranks[indexed[m].i] = avgRank;
    j = k + 1;
  }
  return ranks;
}

function interpretR(r: number): string {
  const abs = Math.abs(r);
  const dir = r >= 0 ? 'positive' : 'negative';
  if (abs >= 0.9) return 'Very strong ' + dir + ' correlation';
  if (abs >= 0.7) return 'Strong ' + dir + ' correlation';
  if (abs >= 0.5) return 'Moderate ' + dir + ' correlation';
  if (abs >= 0.3) return 'Weak ' + dir + ' correlation';
  return 'No significant correlation';
}

export function computeCorrelation(xs: number[], ys: number[]): CorrelationResult {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);

  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  const pearsonR = denom === 0 ? 0 : sumXY / denom;
  const rSquared = pearsonR * pearsonR;
  const slope = sumX2 === 0 ? 0 : sumXY / sumX2;
  const intercept = my - slope * mx;

  // Spearman
  const rxs = rankArray(xs);
  const rys = rankArray(ys);
  let dSumXY = 0, dSumX2 = 0, dSumY2 = 0;
  const mrx = mean(rxs);
  const mry = mean(rys);
  for (let i = 0; i < n; i++) {
    const dx = rxs[i] - mrx;
    const dy = rys[i] - mry;
    dSumXY += dx * dy;
    dSumX2 += dx * dx;
    dSumY2 += dy * dy;
  }
  const sDenom = Math.sqrt(dSumX2 * dSumY2);
  const spearmanR = sDenom === 0 ? 0 : dSumXY / sDenom;

  return {
    n: n,
    pearsonR: pearsonR,
    rSquared: rSquared,
    interpretation: interpretR(pearsonR),
    slope: slope,
    intercept: intercept,
    spearmanR: spearmanR,
  };
}

function fmt(n: number, d: number): string {
  return n.toFixed(d);
}

export function processCorrelation(input: string): string {
  const { xs, ys } = parseTwoColumns(input);
  const r = computeCorrelation(xs, ys);
  const lines = [
    'Data Points (n):          ' + r.n,
    '',
    'Pearson r:                ' + fmt(r.pearsonR, 6),
    'r² (coeff. of det.):      ' + fmt(r.rSquared, 6),
    'Interpretation:           ' + r.interpretation,
    '',
    'Regression Line:          y = ' + fmt(r.slope, 4) + 'x + (' + fmt(r.intercept, 4) + ')',
    '  Slope:                  ' + fmt(r.slope, 6),
    '  Intercept:              ' + fmt(r.intercept, 6),
    '',
    'Spearman ρ:               ' + fmt(r.spearmanR, 6),
  ];
  return lines.join('\n');
}
