import { computeCI, computeCIFromData, processCI, parseNumbers } from '@/Components/Functions/ConfidenceIntervalTools/logic';

describe('parseNumbers', () => {
  it('parses newline-separated numbers', () => {
    expect(parseNumbers('1\n2\n3')).toEqual([1, 2, 3]);
  });
  it('parses comma-separated numbers', () => {
    expect(parseNumbers('1,2,3')).toEqual([1, 2, 3]);
  });
  it('throws for invalid numbers', () => {
    expect(() => parseNumbers('1\nabc\n3')).toThrow();
  });
});

describe('computeCI', () => {
  it('computes 95% CI correctly', () => {
    const r = computeCI(100, 15, 25, 95);
    expect(r.standardError).toBeCloseTo(3, 0);
    expect(r.lowerBound).toBeLessThan(100);
    expect(r.upperBound).toBeGreaterThan(100);
    expect(r.confidenceLevel).toBe(95);
  });
  it('CI is symmetric around mean', () => {
    const r = computeCI(50, 10, 30, 95);
    expect(50 - r.lowerBound).toBeCloseTo(r.upperBound - 50, 5);
  });
  it('throws for n < 2', () => {
    expect(() => computeCI(5, 1, 1, 95)).toThrow();
  });
  it('throws for invalid confidence level', () => {
    expect(() => computeCI(5, 1, 10, 80 as any)).toThrow();
  });
  it('larger n = narrower CI', () => {
    const r1 = computeCI(100, 10, 10, 95);
    const r2 = computeCI(100, 10, 100, 95);
    expect(r2.marginOfError).toBeLessThan(r1.marginOfError);
  });
});

describe('computeCIFromData', () => {
  it('computes from raw data', () => {
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    const r = computeCIFromData(data, 95);
    expect(r.mean).toBeCloseTo(5, 5);
    expect(r.n).toBe(8);
    expect(r.lowerBound).toBeLessThan(5);
    expect(r.upperBound).toBeGreaterThan(5);
  });
  it('throws for fewer than 2 items', () => {
    expect(() => computeCIFromData([5], 95)).toThrow();
  });
});

describe('processCI', () => {
  it('processes summary stats mode (3 lines)', () => {
    const out = processCI('100\n15\n25', 95);
    expect(out).toContain('Confidence Interval');
    expect(out).toContain('95%');
    expect(out).toContain('Lower Bound');
    expect(out).toContain('Upper Bound');
  });
  it('processes raw data mode', () => {
    const out = processCI('1\n2\n3\n4\n5\n6\n7\n8\n9\n10', 90);
    expect(out).toContain('Confidence Interval');
  });
  it('throws for empty input', () => {
    expect(() => processCI('', 95)).toThrow();
  });
});
