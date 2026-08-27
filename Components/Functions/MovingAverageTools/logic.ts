// Components/Functions/MovingAverageTools/logic.ts

export type MAType = 'sma' | 'ema' | 'wma';

export function parseNumbers(input: string): number[] {
  const parts = input.split('\n');
  const nums: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].trim();
    if (!t) continue;
    const n = parseFloat(t);
    if (isNaN(n)) throw new Error('Invalid number on line ' + (i + 1) + ': "' + t + '"');
    nums.push(n);
  }
  return nums;
}

/** Simple Moving Average */
export function computeSMA(data: number[], window_: number): Array<number | null> {
  const result: Array<number | null> = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window_ - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - window_ + 1; j <= i; j++) sum += data[j];
    result.push(sum / window_);
  }
  return result;
}

/** Exponential Moving Average */
export function computeEMA(data: number[], window_: number): Array<number | null> {
  const alpha = 2 / (window_ + 1);
  const result: Array<number | null> = [];
  let ema: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (ema === null) {
      ema = data[i];
    } else {
      ema = alpha * data[i] + (1 - alpha) * ema;
    }
    result.push(ema);
  }
  return result;
}

/** Weighted Moving Average */
export function computeWMA(data: number[], window_: number): Array<number | null> {
  const result: Array<number | null> = [];
  const weightSum = (window_ * (window_ + 1)) / 2;
  for (let i = 0; i < data.length; i++) {
    if (i < window_ - 1) {
      result.push(null);
      continue;
    }
    let weighted = 0;
    for (let j = 0; j < window_; j++) {
      weighted += data[i - window_ + 1 + j] * (j + 1);
    }
    result.push(weighted / weightSum);
  }
  return result;
}

function fmt(n: number): string {
  return n.toFixed(4);
}

export function processMA(input: string, maType: MAType, window_: number): string {
  const data = parseNumbers(input);
  if (data.length === 0) throw new Error('No numbers provided.');
  if (window_ < 1) throw new Error('Window size must be at least 1.');
  if (window_ > data.length) throw new Error('Window size (' + window_ + ') exceeds data length (' + data.length + ').');

  let values: Array<number | null>;
  let label: string;
  switch (maType) {
    case 'sma':
      values = computeSMA(data, window_);
      label = 'SMA(' + window_ + ')';
      break;
    case 'ema':
      values = computeEMA(data, window_);
      label = 'EMA(' + window_ + ', α=' + (2 / (window_ + 1)).toFixed(4) + ')';
      break;
    case 'wma':
      values = computeWMA(data, window_);
      label = 'WMA(' + window_ + ')';
      break;
    default:
      throw new Error('Unknown MA type.');
  }

  const lines: string[] = ['Index  Data      ' + label];
  for (let i = 0; i < data.length; i++) {
    const v = values[i];
    const vStr = v === null ? '—         (insufficient data)' : fmt(v);
    lines.push(
      String(i + 1).padStart(5) + '  ' +
      String(data[i]).padEnd(10) + '  ' +
      vStr
    );
  }
  return lines.join('\n');
}
