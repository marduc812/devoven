import { parseNumbers, computeFullStats } from '@/Components/Functions/StatisticsTools/logic';

describe('parseNumbers', () => {
  it('comma separated', () => expect(parseNumbers('1,2,3')).toEqual([1, 2, 3]));
  it('newline separated', () => expect(parseNumbers('1\n2\n3')).toEqual([1, 2, 3]));
  it('mixed', () => expect(parseNumbers('1,2\n3,4')).toEqual([1, 2, 3, 4]));
  it('throws on invalid', () => expect(() => parseNumbers('1,abc,3')).toThrow());
  it('returns empty array on empty string', () => expect(parseNumbers('')).toEqual([]));
});

describe('computeFullStats', () => {
  const nums = [4, 1, 2, 5, 3];

  it('count', () => expect(computeFullStats(nums).count).toBe(5));
  it('sum', () => expect(computeFullStats(nums).sum).toBe(15));
  it('min', () => expect(computeFullStats(nums).min).toBe(1));
  it('max', () => expect(computeFullStats(nums).max).toBe(5));
  it('mean', () => expect(computeFullStats(nums).mean).toBe(3));
  it('median', () => expect(computeFullStats(nums).median).toBe(3));
  it('range', () => expect(computeFullStats(nums).range).toBe(4));

  it('q1, q2, q3', () => {
    const r = computeFullStats([1, 2, 3, 4, 5, 6, 7]);
    expect(r.q1).toBeCloseTo(2.5);
    expect(r.q2).toBeCloseTo(4);
    expect(r.q3).toBeCloseTo(5.5);
  });

  it('mode of [1,2,2,3]', () => {
    const r = computeFullStats([1, 2, 2, 3]);
    expect(r.mode).toContain(2);
  });

  it('iqr', () => {
    const r = computeFullStats([1, 2, 3, 4, 5]);
    expect(r.iqr).toBeGreaterThanOrEqual(0);
  });
});
