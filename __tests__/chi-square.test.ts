import { computeChiSquare, processChiSquare } from '@/Components/Functions/ChiSquareTools/logic';

describe('computeChiSquare', () => {
  it('computes chi-square statistic correctly', () => {
    // Classic example: observed [20, 30, 10, 40], expected uniform [25, 25, 25, 25]
    const r = computeChiSquare([20, 30, 10, 40], null);
    const expected = 25;
    const chi2 = ((20-expected)**2/expected) + ((30-expected)**2/expected) + ((10-expected)**2/expected) + ((40-expected)**2/expected);
    expect(r.chiSquare).toBeCloseTo(chi2, 4);
  });
  it('df = k - 1', () => {
    const r = computeChiSquare([10, 20, 30], null);
    expect(r.df).toBe(2);
  });
  it('p-value is 1 when observed = expected', () => {
    const r = computeChiSquare([25, 25, 25, 25], [25, 25, 25, 25]);
    expect(r.chiSquare).toBe(0);
    expect(r.pValue).toBeCloseTo(1, 2);
  });
  it('rejects H0 for very unequal distribution', () => {
    // Very large chi-square
    const r = computeChiSquare([100, 0, 0, 0], null);
    expect(r.alpha05).toBe(true);
    expect(r.alpha01).toBe(true);
  });
  it('throws when lengths differ', () => {
    expect(() => computeChiSquare([10, 20, 30], [10, 20])).toThrow();
  });
  it('throws for fewer than 2 categories', () => {
    expect(() => computeChiSquare([100], null)).toThrow();
  });
  it('accepts custom expected', () => {
    const r = computeChiSquare([10, 20], [15, 15]);
    const chi2 = (10-15)**2/15 + (20-15)**2/15;
    expect(r.chiSquare).toBeCloseTo(chi2, 4);
  });
  it('p-value between 0 and 1', () => {
    const r = computeChiSquare([10, 20, 15, 5], null);
    expect(r.pValue).toBeGreaterThan(0);
    expect(r.pValue).toBeLessThanOrEqual(1);
  });
});

describe('processChiSquare', () => {
  it('produces formatted output', () => {
    const out = processChiSquare('20,30,10,40', '');
    expect(out).toContain('Chi-Square Statistic');
    expect(out).toContain('p-value');
    expect(out).toContain('α = 0.05');
    expect(out).toContain('α = 0.01');
  });
  it('notes uniform distribution when no expected', () => {
    const out = processChiSquare('10,20,30', '');
    expect(out).toContain('uniform');
  });
  it('throws for empty observed', () => {
    expect(() => processChiSquare('', '')).toThrow();
  });
  it('handles custom expected', () => {
    const out = processChiSquare('10,20,30', '20,20,20');
    expect(out).toContain('Chi-Square Statistic');
    expect(out).not.toContain('uniform');
  });
});
