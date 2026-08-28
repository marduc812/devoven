// Components/Functions/ConfidenceIntervalTools/logic.ts

/**
 * Two-tailed t critical values for confidence levels.
 * Key: degrees of freedom (or 'inf' for z-value).
 */
const T_TABLE: Record<string, Record<number, number>> = {
  '1':   { 90: 6.314, 95: 12.706, 99: 63.657 },
  '2':   { 90: 2.920, 95: 4.303,  99: 9.925  },
  '3':   { 90: 2.353, 95: 3.182,  99: 5.841  },
  '4':   { 90: 2.132, 95: 2.776,  99: 4.604  },
  '5':   { 90: 2.015, 95: 2.571,  99: 4.032  },
  '6':   { 90: 1.943, 95: 2.447,  99: 3.707  },
  '7':   { 90: 1.895, 95: 2.365,  99: 3.499  },
  '8':   { 90: 1.860, 95: 2.306,  99: 3.355  },
  '9':   { 90: 1.833, 95: 2.262,  99: 3.250  },
  '10':  { 90: 1.812, 95: 2.228,  99: 3.169  },
  '11':  { 90: 1.796, 95: 2.201,  99: 3.106  },
  '12':  { 90: 1.782, 95: 2.179,  99: 3.055  },
  '13':  { 90: 1.771, 95: 2.160,  99: 3.012  },
  '14':  { 90: 1.761, 95: 2.145,  99: 2.977  },
  '15':  { 90: 1.753, 95: 2.131,  99: 2.947  },
  '20':  { 90: 1.725, 95: 2.086,  99: 2.845  },
  '25':  { 90: 1.708, 95: 2.060,  99: 2.787  },
  '30':  { 90: 1.697, 95: 2.042,  99: 2.750  },
  '40':  { 90: 1.684, 95: 2.021,  99: 2.704  },
  '60':  { 90: 1.671, 95: 2.000,  99: 2.660  },
  '120': { 90: 1.658, 95: 1.980,  99: 2.617  },
  'inf': { 90: 1.645, 95: 1.960,  99: 2.576  },
};

const DF_BREAKPOINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 30, 40, 60, 120];

function getCriticalValue(df: number, cl: number): number {
  if (df >= 120) return T_TABLE['inf'][cl];
  // Find nearest breakpoint (conservative: round down to nearest known df)
  let best = DF_BREAKPOINTS[0];
  for (let i = 0; i < DF_BREAKPOINTS.length; i++) {
    if (DF_BREAKPOINTS[i] <= df) best = DF_BREAKPOINTS[i];
  }
  return T_TABLE[String(best)][cl];
}

export interface CIResult {
  mean: number;
  stdDev: number;
  n: number;
  confidenceLevel: number;
  criticalValue: number;
  standardError: number;
  marginOfError: number;
  lowerBound: number;
  upperBound: number;
  df: number;
  usingZ: boolean;
}

export function parseNumbers(input: string): number[] {
  const parts = input.split(/[\n,]+/);
  const nums: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].trim();
    if (!t) continue;
    const n = parseFloat(t);
    if (isNaN(n)) throw new Error('Invalid number: "' + t + '"');
    nums.push(n);
  }
  return nums;
}

export function computeCI(mean_: number, stdDev: number, n: number, confidenceLevel: number): CIResult {
  if (n < 2) throw new Error('Sample size must be at least 2.');
  if (stdDev < 0) throw new Error('Standard deviation must be non-negative.');
  if (![90, 95, 99].includes(confidenceLevel)) throw new Error('Confidence level must be 90, 95, or 99.');

  const df = n - 1;
  const usingZ = n >= 120;
  const criticalValue = getCriticalValue(df, confidenceLevel);
  const standardError = stdDev / Math.sqrt(n);
  const marginOfError = criticalValue * standardError;

  return {
    mean: mean_,
    stdDev: stdDev,
    n: n,
    confidenceLevel: confidenceLevel,
    criticalValue: criticalValue,
    standardError: standardError,
    marginOfError: marginOfError,
    lowerBound: mean_ - marginOfError,
    upperBound: mean_ + marginOfError,
    df: df,
    usingZ: usingZ,
  };
}

/** Compute CI from raw data */
export function computeCIFromData(nums: number[], confidenceLevel: number): CIResult {
  if (nums.length < 2) throw new Error('At least 2 data points required.');
  const n = nums.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += nums[i];
  const m = sum / n;
  let sq = 0;
  for (let i = 0; i < n; i++) sq += (nums[i] - m) * (nums[i] - m);
  const s = Math.sqrt(sq / (n - 1));
  return computeCI(m, s, n, confidenceLevel);
}

function fmt(n: number, d: number): string {
  return n.toFixed(d);
}

export function processCI(input: string, confidenceLevel: number): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('No input provided.');

  const lines = trimmed.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });

  let r: CIResult;

  if (lines.length >= 3) {
    // Try summary stats mode: line 1 = mean, line 2 = std dev, line 3 = n
    const m = parseFloat(lines[0]);
    const s = parseFloat(lines[1]);
    const n = parseFloat(lines[2]);
    if (!isNaN(m) && !isNaN(s) && !isNaN(n) && Number.isInteger(n) && n >= 2) {
      r = computeCI(m, s, n, confidenceLevel);
    } else {
      // raw data fallback
      const nums = parseNumbers(trimmed);
      r = computeCIFromData(nums, confidenceLevel);
    }
  } else {
    const nums = parseNumbers(trimmed);
    r = computeCIFromData(nums, confidenceLevel);
  }

  const statType = r.usingZ ? 'z' : 't';
  return [
    'Sample Mean:              ' + fmt(r.mean, 4),
    'Sample Std Dev:           ' + fmt(r.stdDev, 4),
    'Sample Size (n):          ' + r.n,
    'Degrees of Freedom:       ' + r.df,
    '',
    'Confidence Level:         ' + r.confidenceLevel + '%',
    'Critical Value (' + statType + '):      ' + fmt(r.criticalValue, 4),
    'Standard Error:           ' + fmt(r.standardError, 4),
    'Margin of Error:          ' + fmt(r.marginOfError, 4),
    '',
    'Confidence Interval:',
    '  Lower Bound:            ' + fmt(r.lowerBound, 4),
    '  Upper Bound:            ' + fmt(r.upperBound, 4),
    '',
    'Interpretation:',
    '  We are ' + r.confidenceLevel + '% confident the true population mean',
    '  lies between ' + fmt(r.lowerBound, 4) + ' and ' + fmt(r.upperBound, 4) + '.',
  ].join('\n');
}
