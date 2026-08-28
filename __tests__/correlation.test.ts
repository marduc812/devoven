import { parseTwoColumns, computeCorrelation, processCorrelation } from '@/Components/Functions/CorrelationTools/logic';

describe('parseTwoColumns', () => {
  it('parses comma-separated pairs', () => {
    const { xs, ys } = parseTwoColumns('1, 2\n3, 4\n5, 6');
    expect(xs).toEqual([1, 3, 5]);
    expect(ys).toEqual([2, 4, 6]);
  });
  it('parses tab-separated pairs', () => {
    const { xs, ys } = parseTwoColumns('1\t2\n3\t4');
    expect(xs).toEqual([1, 3]);
    expect(ys).toEqual([2, 4]);
  });
  it('throws for single column', () => {
    expect(() => parseTwoColumns('1\n2\n3')).toThrow();
  });
  it('throws for fewer than 2 pairs', () => {
    expect(() => parseTwoColumns('1, 2')).toThrow();
  });
});

describe('computeCorrelation', () => {
  it('returns r=1 for perfectly positive linear data', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    const r = computeCorrelation(xs, ys);
    expect(r.pearsonR).toBeCloseTo(1, 5);
    expect(r.rSquared).toBeCloseTo(1, 5);
    expect(r.slope).toBeCloseTo(2, 4);
    expect(r.intercept).toBeCloseTo(0, 4);
  });
  it('returns r=-1 for perfectly negative linear data', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [10, 8, 6, 4, 2];
    const r = computeCorrelation(xs, ys);
    expect(r.pearsonR).toBeCloseTo(-1, 5);
  });
  it('returns r=0 for uncorrelated data', () => {
    // y is symmetric: goes up then down, x is monotone increasing
    // Use a case where Σ(xi - mx)(yi - my) = 0
    const xs = [1, 2, 3, 4, 5];
    const ys = [3, 5, 4, 2, 1]; // no clear linear trend with xs
    // Just check it's not +/- 1
    const r = computeCorrelation(xs, ys);
    expect(Math.abs(r.pearsonR)).toBeLessThan(1);
    // For a verified zero case: xs and ys orthogonal
    const xs2 = [1, 2, 3, 4];
    const ys2 = [2, 2, 2, 2]; // zero variance => r = 0
    const r2 = computeCorrelation(xs2, ys2);
    expect(r2.pearsonR).toBe(0);
  });
  it('computes Spearman correctly for monotone data', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [1, 4, 9, 16, 25]; // nonlinear but monotone
    const r = computeCorrelation(xs, ys);
    expect(r.spearmanR).toBeCloseTo(1, 5);
  });
  it('interpretation: very strong positive', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    const r = computeCorrelation(xs, ys);
    expect(r.interpretation).toContain('strong');
  });
});

describe('processCorrelation', () => {
  it('produces formatted output', () => {
    const out = processCorrelation('1,2\n2,4\n3,6\n4,8\n5,10');
    expect(out).toContain('Pearson r');
    expect(out).toContain('1.000000');
    expect(out).toContain('Spearman');
  });
  it('throws for invalid input', () => {
    expect(() => processCorrelation('abc,def\nxyz,123')).toThrow();
  });
});
