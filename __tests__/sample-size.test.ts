import {
  computeSampleSize,
  computeInfiniteSampleSize,
  processSampleSize,
  buildTable,
} from '../Components/Functions/SampleSizeTools/logic';

describe('computeInfiniteSampleSize', () => {
  it('returns correct sample size for 95% confidence and 5% margin', () => {
    // Cochran formula: z=1.96, e=0.05, p=0.5 → (1.96^2 * 0.25) / 0.0025 = 384.16 → ceil = 385
    const n = computeInfiniteSampleSize(95, 5);
    expect(n).toBe(385);
  });

  it('returns correct sample size for 99% confidence and 5% margin', () => {
    // z=2.576, e=0.05 → (2.576^2 * 0.25) / 0.0025 ≈ 664.2 → ceil = 665
    const n = computeInfiniteSampleSize(99, 5);
    expect(n).toBe(664);
  });

  it('returns correct sample size for 90% confidence and 10% margin', () => {
    // z=1.645, e=0.10 → (1.645^2 * 0.25) / 0.01 = 67.65 → ceil = 68
    const n = computeInfiniteSampleSize(90, 10);
    expect(n).toBe(68);
  });
});

describe('computeSampleSize', () => {
  it('applies finite population correction', () => {
    const n0 = computeInfiniteSampleSize(95, 5); // 385
    const nFinite = computeSampleSize(1000, 95, 5);
    expect(nFinite).toBeLessThan(n0);
    expect(nFinite).toBeGreaterThan(0);
  });

  it('matches infinite when population is Infinity', () => {
    const nInf = computeSampleSize(Infinity, 95, 5);
    const n0 = computeInfiniteSampleSize(95, 5);
    expect(nInf).toBe(n0);
  });

  it('throws on invalid confidence level', () => {
    expect(() => computeSampleSize(1000, 80, 5)).toThrow();
  });

  it('throws on invalid margin of error', () => {
    expect(() => computeSampleSize(1000, 95, 0)).toThrow();
    expect(() => computeSampleSize(1000, 95, 100)).toThrow();
  });
});

describe('buildTable', () => {
  it('builds a table with 15 rows (3 confidence × 5 margins)', () => {
    const table = buildTable(Infinity);
    expect(table.length).toBe(15);
  });

  it('all sample sizes are positive integers', () => {
    const table = buildTable(500);
    for (const row of table) {
      expect(row.sampleSize).toBeGreaterThan(0);
      expect(Number.isInteger(row.sampleSize)).toBe(true);
    }
  });
});

describe('processSampleSize', () => {
  it('returns output for valid infinite population input', () => {
    const result = processSampleSize('infinite\n95\n5');
    expect(result).toContain('385');
    expect(result).toContain('Infinite');
  });

  it('returns output for finite population', () => {
    const result = processSampleSize('10000\n95\n5');
    expect(result).toContain('10,000');
    expect(result).toContain('Adjusted Sample Size');
  });

  it('throws if fewer than 3 lines', () => {
    expect(() => processSampleSize('1000\n95')).toThrow();
  });

  it('throws on invalid confidence level', () => {
    expect(() => processSampleSize('1000\n80\n5')).toThrow();
  });

  it('handles inf keyword', () => {
    const result = processSampleSize('inf\n90\n3');
    expect(result).toContain('Infinite');
  });
});
