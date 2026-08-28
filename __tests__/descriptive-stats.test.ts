import { parseNumbers, computeStats, histogram, formatStatValue } from '@/Components/Functions/DescriptiveStatsTools/logic';

describe('histogram', () => {
  it('returns no bins for an empty list', () => expect(histogram([])).toEqual([]));
  it('collapses a single distinct value into one bin', () => {
    expect(histogram([5, 5, 5])).toEqual([{ start: 5, end: 5, count: 3 }]);
  });
  it('keeps every value — bin counts sum to the input length', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(histogram(values).reduce((a, b) => a + b.count, 0)).toBe(values.length);
  });
  it('puts the maximum in the last bin', () => {
    const bins = histogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100], 4);
    expect(bins[bins.length - 1].count).toBe(1);
  });
  it('never makes more bins than there are values', () => {
    expect(histogram([1, 2, 3], 12).length).toBeLessThanOrEqual(3);
  });
});

describe('formatStatValue', () => {
  it('leaves integers alone', () => expect(formatStatValue(42)).toBe('42'));
  it('trims float noise', () => expect(formatStatValue(1 / 3)).toBe('0.333333'));
});

describe('parseNumbers', () => {
  it('parses newline-separated numbers', () => {
    expect(parseNumbers('1\n2\n3')).toEqual([1, 2, 3]);
  });
  it('parses comma-separated numbers', () => {
    expect(parseNumbers('4, 5, 6')).toEqual([4, 5, 6]);
  });
  it('parses mixed separators', () => {
    expect(parseNumbers('1,2\n3')).toEqual([1, 2, 3]);
  });
  it('ignores blank entries', () => {
    expect(parseNumbers('1\n\n2')).toEqual([1, 2]);
  });
  it('throws on invalid number', () => {
    expect(() => parseNumbers('1\nabc')).toThrow('Invalid number');
  });
});

describe('computeStats', () => {
  const nums = [2, 4, 4, 4, 5, 5, 7, 9];

  it('computes count', () => {
    expect(computeStats(nums).count).toBe(8);
  });
  it('computes sum', () => {
    expect(computeStats(nums).sum).toBe(40);
  });
  it('computes mean', () => {
    expect(computeStats(nums).mean).toBe(5);
  });
  it('computes median', () => {
    expect(computeStats(nums).median).toBe(4.5);
  });
  it('computes mode', () => {
    expect(computeStats(nums).mode).toEqual([4]);
  });
  it('computes range', () => {
    expect(computeStats(nums).range).toBe(7);
  });
  it('computes min and max', () => {
    expect(computeStats(nums).min).toBe(2);
    expect(computeStats(nums).max).toBe(9);
  });
  it('computes std deviation', () => {
    const r = computeStats(nums);
    expect(r.stdDev).toBeCloseTo(2, 0);
  });
  it('computes percentiles', () => {
    const r = computeStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.p25).toBeGreaterThan(2);
    expect(r.p75).toBeGreaterThan(6);
    expect(r.p90).toBeGreaterThan(8);
    expect(r.p95).toBeGreaterThan(9);
  });
  it('throws on empty array', () => {
    expect(() => computeStats([])).toThrow('No numbers provided');
  });
  it('returns sorted list', () => {
    expect(computeStats([3, 1, 2]).sorted).toEqual([1, 2, 3]);
  });
});
