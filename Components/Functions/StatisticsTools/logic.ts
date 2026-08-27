export interface FullStatsResult {
  count: number;
  sum: number;
  min: number;
  max: number;
  range: number;
  mean: number;
  median: number;
  mode: number[];
  modeFreq: number;
  variance: number;
  stdDev: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  sorted: number[];
  frequencyDist: Array<{ value: number; freq: number; pct: string }>;
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

function quartile(sorted: number[], q: number): number {
  // Inclusive quartile method
  const n = sorted.length;
  const pos = (q / 4) * (n - 1);
  const low = Math.floor(pos);
  const high = Math.ceil(pos);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (pos - low);
}

export function computeFullStats(nums: number[]): FullStatsResult {
  if (nums.length === 0) throw new Error('No numbers provided');

  const sorted = nums.slice().sort((a, b) => a - b);
  const count = nums.length;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += nums[i];
  const mean = sum / count;

  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Variance (population)
  let varSum = 0;
  for (let i = 0; i < count; i++) varSum += (nums[i] - mean) * (nums[i] - mean);
  const variance = varSum / count;
  const stdDev = Math.sqrt(variance);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  const q1 = quartile(sorted, 1);
  const q2 = quartile(sorted, 2);
  const q3 = quartile(sorted, 3);
  const iqr = q3 - q1;

  // Frequency distribution
  const freqMap: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    const k = String(nums[i]);
    freqMap[k] = (freqMap[k] || 0) + 1;
  }
  let maxFreq = 0;
  const keys = Object.keys(freqMap);
  for (const k of keys) if (freqMap[k] > maxFreq) maxFreq = freqMap[k];
  const mode: number[] = [];
  for (const k of keys) if (freqMap[k] === maxFreq) mode.push(parseFloat(k));
  mode.sort((a, b) => a - b);

  const uniqueSorted = Object.keys(freqMap).map(parseFloat).sort((a, b) => a - b);
  const frequencyDist = uniqueSorted.map(v => ({
    value: v,
    freq: freqMap[String(v)],
    pct: ((freqMap[String(v)] / count) * 100).toFixed(1) + '%',
  }));

  return {
    count, sum, min, max, range, mean, median, mode, modeFreq: maxFreq,
    variance, stdDev, q1, q2, q3, iqr, sorted, frequencyDist,
  };
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(8)).toString();
}

/** Public alias of the internal formatter, for rendering values in the UI. */
export function formatStatValue(n: number): string {
  return fmt(n);
}
