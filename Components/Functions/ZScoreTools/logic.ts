// Components/Functions/ZScoreTools/logic.ts

/**
 * Abramowitz & Stegun approximation for erf (max error ~1.5e-7).
 */
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + p * ax);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return sign * (1.0 - poly * Math.exp(-ax * ax));
}

/**
 * CDF of the standard normal distribution.
 * P(Z <= z)
 */
export function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/** Density of the standard normal distribution at z, for drawing the curve. */
export function normalPDF(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

/**
 * Odds of landing at least as far from the mean as z, in either direction,
 * expressed as "1 in N". At the mean that is 1 in 1, since every observation is
 * at least that close. Returns null once the tail underflows the erf
 * approximation and no honest figure is left.
 */
export function twoTailedOdds(z: number): number | null {
  const p = Math.min(1, 2 * (1 - normalCDF(Math.abs(z))));
  if (p <= 0) return null;
  return 1 / p;
}

export interface ZScoreResult {
  zScore: number;
  percentile: number;
  probLess: number;
  probGreater: number;
  interpretation: string;
}

export function computeZScore(value: number, mu: number, sigma: number): ZScoreResult {
  if (sigma <= 0) throw new Error('Standard deviation must be greater than 0.');
  const z = (value - mu) / sigma;
  const cdf = normalCDF(z);
  const pct = cdf * 100;

  let interpretation: string;
  if (Math.abs(z) < 1) interpretation = 'Within 1 standard deviation of the mean (common range)';
  else if (Math.abs(z) < 2) interpretation = 'Between 1 and 2 standard deviations from the mean';
  else if (Math.abs(z) < 3) interpretation = 'Between 2 and 3 standard deviations from the mean (uncommon)';
  else interpretation = 'More than 3 standard deviations from the mean (rare)';

  return {
    zScore: z,
    percentile: pct,
    probLess: cdf,
    probGreater: 1 - cdf,
    interpretation: interpretation,
  };
}

function fmt(n: number, d: number): string {
  return n.toFixed(d);
}

export function processZScore(input: string): string {
  const lines = input.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  if (lines.length < 3) throw new Error('Enter three lines: value, mean, standard deviation.');

  const value = parseFloat(lines[0]);
  const mu = parseFloat(lines[1]);
  const sigma = parseFloat(lines[2]);
  if (isNaN(value) || isNaN(mu) || isNaN(sigma)) throw new Error('All three inputs must be valid numbers.');

  const r = computeZScore(value, mu, sigma);
  return [
    'Z-Score:                  ' + fmt(r.zScore, 6),
    'Percentile Rank:          ' + fmt(r.percentile, 4) + '%',
    'P(X < value):             ' + fmt(r.probLess, 6),
    'P(X > value):             ' + fmt(r.probGreater, 6),
    '',
    'Interpretation:',
    '  ' + r.interpretation,
  ].join('\n');
}
