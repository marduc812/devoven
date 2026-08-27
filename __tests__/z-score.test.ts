import { normalCDF, normalPDF, twoTailedOdds, computeZScore, processZScore } from '@/Components/Functions/ZScoreTools/logic';

describe('normalCDF', () => {
  it('returns 0.5 at z=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 5);
  });
  it('returns ~0.8413 at z=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });
  it('returns ~0.9772 at z=2', () => {
    expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
  });
  it('returns ~0.1587 at z=-1', () => {
    expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
  });
  it('approaches 1 at z=5', () => {
    expect(normalCDF(5)).toBeGreaterThan(0.9999);
  });
  it('approaches 0 at z=-5', () => {
    expect(normalCDF(-5)).toBeLessThan(0.0001);
  });
});

describe('computeZScore', () => {
  it('computes z-score correctly', () => {
    const r = computeZScore(70, 60, 10);
    expect(r.zScore).toBeCloseTo(1, 5);
    expect(r.percentile).toBeCloseTo(84.13, 1);
  });
  it('probLess + probGreater = 1', () => {
    const r = computeZScore(100, 100, 15);
    expect(r.probLess + r.probGreater).toBeCloseTo(1, 5);
  });
  it('throws for sigma <= 0', () => {
    expect(() => computeZScore(5, 3, 0)).toThrow();
    expect(() => computeZScore(5, 3, -1)).toThrow();
  });
  it('z=0 when value equals mean', () => {
    const r = computeZScore(50, 50, 10);
    expect(r.zScore).toBe(0);
    expect(r.percentile).toBeCloseTo(50, 3);
  });
  it('negative z-score for value below mean', () => {
    const r = computeZScore(40, 50, 10);
    expect(r.zScore).toBeCloseTo(-1, 5);
  });
});

describe('processZScore', () => {
  it('returns formatted output', () => {
    const out = processZScore('70\n60\n10');
    expect(out).toContain('Z-Score');
    expect(out).toContain('Percentile');
    expect(out).toContain('1.000000');
  });
  it('throws with fewer than 3 lines', () => {
    expect(() => processZScore('70\n60')).toThrow();
  });
  it('throws with non-numeric input', () => {
    expect(() => processZScore('a\nb\nc')).toThrow();
  });
});

describe('normalPDF', () => {
  it('peaks at z=0', () => expect(normalPDF(0)).toBeCloseTo(0.39894, 4));
  it('is symmetric', () => expect(normalPDF(-1.3)).toBeCloseTo(normalPDF(1.3), 10));
  it('falls off away from the mean', () => expect(normalPDF(3)).toBeLessThan(normalPDF(1)));
  it('stays positive far out', () => expect(normalPDF(6)).toBeGreaterThan(0));
});

describe('twoTailedOdds', () => {
  it('1 in ~3 at one sigma', () => expect(twoTailedOdds(1)).toBeCloseTo(3.15, 1));
  it('1 in ~22 at two sigma', () => expect(twoTailedOdds(2)).toBeCloseTo(21.98, 0));
  it('ignores the sign', () => expect(twoTailedOdds(-2)).toBeCloseTo(twoTailedOdds(2) as number, 6));
  it('rarer readings give longer odds', () =>
    expect(twoTailedOdds(3) as number).toBeGreaterThan(twoTailedOdds(2) as number));
  it('is 1 in 1 at the mean, since nothing is closer', () =>
    expect(twoTailedOdds(0)).toBeCloseTo(1, 6));
  it('returns null once the tail underflows', () => expect(twoTailedOdds(40)).toBeNull());
});
