import { parseNumbers, computeSMA, computeEMA, computeWMA, processMA } from '@/Components/Functions/MovingAverageTools/logic';

describe('parseNumbers', () => {
  it('parses newline-separated numbers', () => {
    expect(parseNumbers('1\n2\n3')).toEqual([1, 2, 3]);
  });
  it('skips empty lines', () => {
    expect(parseNumbers('1\n\n2')).toEqual([1, 2]);
  });
  it('throws for invalid number', () => {
    expect(() => parseNumbers('1\nabc\n3')).toThrow();
  });
});

describe('computeSMA', () => {
  it('returns null for insufficient data', () => {
    const result = computeSMA([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
  });
  it('computes correctly at window boundary', () => {
    const result = computeSMA([1, 2, 3, 4, 5], 3);
    expect(result[2]).toBeCloseTo(2, 5);
    expect(result[3]).toBeCloseTo(3, 5);
    expect(result[4]).toBeCloseTo(4, 5);
  });
  it('window=1 returns the data itself', () => {
    const data = [5, 10, 15];
    const result = computeSMA(data, 1);
    expect(result).toEqual([5, 10, 15]);
  });
});

describe('computeEMA', () => {
  it('starts at first value', () => {
    const data = [10, 20, 30, 40, 50];
    const result = computeEMA(data, 3);
    expect(result[0]).toBe(10);
  });
  it('has no null values', () => {
    const data = [1, 2, 3, 4, 5];
    const result = computeEMA(data, 3);
    expect(result.every(function(v) { return v !== null; })).toBe(true);
  });
  it('approaches data for long series', () => {
    // Last EMA value should be close to recent values for small alpha
    const data = [100, 100, 100, 200, 200, 200, 200, 200, 200, 200];
    const result = computeEMA(data, 2) as number[];
    expect(result[result.length - 1]).toBeGreaterThan(150);
  });
});

describe('computeWMA', () => {
  it('returns null for insufficient data', () => {
    const result = computeWMA([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
  });
  it('weights recent values more', () => {
    // WMA window=3 at index 2 = (1*1 + 2*2 + 3*3) / (1+2+3) = 14/6 ≈ 2.333
    const result = computeWMA([1, 2, 3], 3);
    expect(result[2]).toBeCloseTo(14 / 6, 4);
  });
  it('window=1 returns the data itself', () => {
    const data = [5, 10, 15];
    const result = computeWMA(data, 1);
    expect(result).toEqual([5, 10, 15]);
  });
});

describe('processMA', () => {
  const data = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10';
  it('produces SMA output', () => {
    const out = processMA(data, 'sma', 3);
    expect(out).toContain('SMA(3)');
    expect(out).toContain('—');
  });
  it('produces EMA output', () => {
    const out = processMA(data, 'ema', 3);
    expect(out).toContain('EMA(3');
  });
  it('produces WMA output', () => {
    const out = processMA(data, 'wma', 3);
    expect(out).toContain('WMA(3)');
  });
  it('throws when window > data length', () => {
    expect(() => processMA('1\n2', 'sma', 5)).toThrow();
  });
  it('throws for empty data', () => {
    expect(() => processMA('', 'sma', 3)).toThrow();
  });
  it('throws for window < 1', () => {
    expect(() => processMA(data, 'sma', 0)).toThrow();
  });
});
