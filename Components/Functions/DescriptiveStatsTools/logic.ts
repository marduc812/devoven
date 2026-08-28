export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  range: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  sorted: number[];
}

export function parseNumbers(input: string): number[] {
  const parts = input.split(/[\n,]+/);
  const nums: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].trim();
    if (t === '') continue;
    const n = parseFloat(t);
    if (isNaN(n)) throw new Error('Invalid number: "' + t + '"');
    nums.push(n);
  }
  return nums;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  const frac = idx - low;
  return sorted[low] * (1 - frac) + sorted[high] * frac;
}

export function computeStats(nums: number[]): StatsResult {
  if (nums.length === 0) throw new Error('No numbers provided');

  const sorted = nums.slice().sort(function(a, b) { return a - b; });
  const count = nums.length;
  let sum = 0;
  for (let i = 0; i < nums.length; i++) sum += nums[i];
  const mean = sum / count;

  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const freq: Record<string, number> = {};
  for (let i = 0; i < nums.length; i++) {
    const k = String(nums[i]);
    freq[k] = (freq[k] || 0) + 1;
  }
  let maxFreq = 0;
  const keys = Object.keys(freq);
  for (let i = 0; i < keys.length; i++) {
    if (freq[keys[i]] > maxFreq) maxFreq = freq[keys[i]];
  }
  const mode: number[] = [];
  for (let i = 0; i < keys.length; i++) {
    if (freq[keys[i]] === maxFreq) mode.push(parseFloat(keys[i]));
  }
  mode.sort(function(a, b) { return a - b; });

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  let varSum = 0;
  for (let i = 0; i < nums.length; i++) {
    varSum += (nums[i] - mean) * (nums[i] - mean);
  }
  const variance = varSum / count;
  const stdDev = Math.sqrt(variance);

  return {
    count: count,
    sum: sum,
    mean: mean,
    median: median,
    mode: mode,
    range: range,
    variance: variance,
    stdDev: stdDev,
    min: min,
    max: max,
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    sorted: sorted,
  };
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(6)).toString();
}

/** Public alias of the internal formatter, for rendering values in the UI. */
export function formatStatValue(n: number): string {
  return fmt(n);
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

/**
 * Bucket the sorted values into equal-width bins for a distribution chart.
 * The last bin is inclusive of the maximum so no value is dropped.
 */
export function histogram(sorted: number[], binCount = 12): HistogramBin[] {
  if (sorted.length === 0) return [];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // A single distinct value has no width to divide, so report it as one bin.
  if (min === max) return [{ start: min, end: max, count: sorted.length }];

  const bins = Math.max(1, Math.min(binCount, sorted.length));
  const width = (max - min) / bins;
  const result: HistogramBin[] = [];
  for (let i = 0; i < bins; i++) {
    result.push({ start: min + i * width, end: min + (i + 1) * width, count: 0 });
  }
  for (const value of sorted) {
    const idx = Math.min(bins - 1, Math.floor((value - min) / width));
    result[idx].count++;
  }
  return result;
}
