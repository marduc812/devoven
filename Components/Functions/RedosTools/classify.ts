/**
 * Growth-curve classification.
 *
 * Turns a set of (pump count, elapsed ms) measurements into a complexity class.
 * Pure and deterministic so the classification can be unit tested without
 * running an actual benchmark.
 */

export interface TimingPoint {
  /** Number of times the pump string was repeated. */
  k: number;
  /** Elapsed milliseconds. For a timed-out run this is the cap, not a measurement. */
  ms: number;
  /** True when the run hit the per-run cap and was aborted. */
  timedOut?: boolean;
}

export type GrowthKind = 'inconclusive' | 'linear' | 'polynomial' | 'exponential';

export interface GrowthClass {
  kind: GrowthKind;
  /** Polynomial degree. Present for 'linear' (1) and 'polynomial' (>= 2). */
  degree?: number;
  /** Goodness of fit of the winning hypothesis, 0..1. */
  rSquared: number;
}

/** Readings below this are dominated by timer resolution and scheduling noise. */
const NOISE_FLOOR_MS = 2;

/**
 * Highest power law worth believing. Measured polynomial ReDoS lands at degree
 * 2 or 3; measured exponential blowups force-fit to 12 and up. Nothing real
 * sits in between, so the gap is wide enough to split on.
 */
const MAX_PLAUSIBLE_DEGREE = 6;

/** Below this, neither hypothesis describes the data. */
const MIN_USABLE_FIT = 0.5;

/** A single run this slow is enough to characterise the curve. */
const TARGET_MS = 200;
/** Beyond this the attack string itself gets unwieldy. */
const MAX_PUMP = 65536;
/** Enough measurable points to fit a curve through with real spread. */
const ENOUGH_POINTS = 6;
/** How far from a known-good point the sweep will reach for a neighbour. */
const WIDEN_STEPS = [-1, -2, -3, 1, 2, 3];

/** Slow enough to fit a curve through. A slow-but-finished run is good data. */
const isFittable = (p: TimingPoint) => !p.timedOut && p.ms >= NOISE_FLOOR_MS;
/** Lost in timer noise. Marks the floor of the measurable band. */
const isTooFast = (p: TimingPoint) => !p.timedOut && p.ms < NOISE_FLOOR_MS;
/** Slow enough to stop ramping. */
const isTooSlow = (p: TimingPoint) => p.timedOut === true || p.ms >= TARGET_MS;

/**
 * Chooses the next pump count to measure, or null when the sweep is done.
 *
 * No single spacing serves both curve shapes. Doubling gives a polynomial curve
 * all the spread it needs, but an exponential one goes from immeasurable to
 * timed out within two doublings, so the ramp alone would yield one usable
 * point. Hence three phases:
 *
 *   ramp    double until something is slow enough to characterise
 *   bisect  if nothing is measurable yet, halve into the gap to find the band
 *   widen   step outward from known-good points, nearest and cheapest first
 *
 * Every probe stays strictly inside (lo, hi): below the fastest immeasurable
 * run there is nothing to see, and at or above a run that timed out every probe
 * would burn the full cap for a censored reading.
 */
export function nextSweepK(points: TimingPoint[]): number | null {
  if (points.length === 0) return 2;

  const slow = points.filter(isTooSlow);
  if (slow.length === 0) {
    const doubled = Math.max(...points.map(p => p.k)) * 2;
    return doubled > MAX_PUMP ? null : doubled;
  }

  const fittable = points.filter(isFittable);
  if (fittable.length >= ENOUGH_POINTS) return null;

  const measured = new Set(points.map(p => p.k));
  const timedOutAt = points.filter(p => p.timedOut).map(p => p.k);
  const hi = timedOutAt.length > 0 ? Math.min(...timedOutAt) : MAX_PUMP + 1;
  const fastBelow = points.filter(p => isTooFast(p) && p.k < hi).map(p => p.k);
  const lo = fastBelow.length > 0 ? Math.max(...fastBelow) : 0;

  if (fittable.length === 0) {
    const slowest = Math.min(...slow.map(p => p.k));
    const mid = Math.floor((lo + slowest) / 2);
    return mid > lo && mid < slowest && !measured.has(mid) ? mid : null;
  }

  for (const step of WIDEN_STEPS) {
    for (const point of fittable) {
      const k = point.k + step;
      if (k > lo && k < hi && !measured.has(k)) return k;
    }
  }

  return null;
}

interface Fit {
  slope: number;
  rSquared: number;
}

/** Ordinary least squares. Returns a perfect fit for constant y, which a flat line does describe. */
function leastSquares(xs: number[], ys: number[]): Fit {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - meanX) * (ys[i] - meanY);
    sxx += (xs[i] - meanX) ** 2;
  }

  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - (slope * xs[i] + intercept)) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }

  // Constant y: the model reproduces it exactly, so the fit is perfect. The
  // comparison is relative because summing identical doubles and dividing does
  // not return the original value exactly, leaving ssTot as float dust rather
  // than a true zero.
  const flat = ssTot <= Number.EPSILON * n * Math.max(1, meanY * meanY);
  const rSquared = flat ? 1 : 1 - ssRes / ssTot;
  return { slope, rSquared };
}

export function classifyGrowth(points: TimingPoint[]): GrowthClass {
  // A timed-out run is censored data: its true duration is unknown and at least
  // the cap. Including it would flatten the tail and bias against the very
  // hypothesis it supports, so it is excluded from the fit.
  const usable = points.filter(p => !p.timedOut && p.ms >= NOISE_FLOOR_MS);

  if (usable.length < 3) {
    return { kind: 'inconclusive', rSquared: 0 };
  }

  const logKs = usable.map(p => Math.log(p.k));
  const logMs = usable.map(p => Math.log(p.ms));

  // Slope of log(time) against log(pump count) is the polynomial degree.
  const fit = leastSquares(logKs, logMs);

  if (fit.rSquared < MIN_USABLE_FIT) {
    return { kind: 'inconclusive', rSquared: fit.rSquared };
  }

  // An exponential curve is only measurable across a narrow band of pump counts
  // — from timer noise to a timeout is a handful of doublings — so over that
  // band it force-fits a power law with an absurd exponent and an excellent R².
  // That exponent is the tell. Comparing a log-log fit against a log-linear one
  // cannot work here: across a narrow range of k the two models are nearly the
  // same line, so whichever wins is decided by noise.
  if (fit.slope > MAX_PLAUSIBLE_DEGREE) {
    return { kind: 'exponential', rSquared: fit.rSquared };
  }

  const degree = Math.max(1, Math.round(fit.slope));
  return {
    kind: degree >= 2 ? 'polynomial' : 'linear',
    degree,
    rSquared: fit.rSquared,
  };
}
