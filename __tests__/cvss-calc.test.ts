import { calculateCvss, DEFAULT_METRICS, CvssMetrics } from '@/Components/Functions/CvssCalcTools/logic';

describe('calculateCvss', () => {
  it('returns score 0 when all CIA impacts are None', () => {
    const result = calculateCvss(DEFAULT_METRICS);
    expect(result.score).toBe(0);
    expect(result.severity).toBe('None');
  });

  it('calculates a known Critical score (CVE-2021-44228 log4shell baseline)', () => {
    const metrics: CvssMetrics = {
      attackVector: 'N',
      attackComplexity: 'L',
      privilegesRequired: 'N',
      userInteraction: 'N',
      scope: 'C',
      confidentiality: 'H',
      integrity: 'H',
      availability: 'H',
    };
    const result = calculateCvss(metrics);
    // Log4Shell is 10.0 Critical
    expect(result.score).toBe(10.0);
    expect(result.severity).toBe('Critical');
  });

  it('produces correct vector string format', () => {
    const metrics: CvssMetrics = {
      attackVector: 'N',
      attackComplexity: 'L',
      privilegesRequired: 'N',
      userInteraction: 'N',
      scope: 'U',
      confidentiality: 'H',
      integrity: 'H',
      availability: 'H',
    };
    const result = calculateCvss(metrics);
    expect(result.vectorString).toMatch(/^CVSS:3\.1\/AV:N\/AC:L\/PR:N\/UI:N\/S:U\/C:H\/I:H\/A:H$/);
  });

  it('severity is Low for low scores', () => {
    const metrics: CvssMetrics = {
      attackVector: 'P',
      attackComplexity: 'H',
      privilegesRequired: 'H',
      userInteraction: 'R',
      scope: 'U',
      confidentiality: 'L',
      integrity: 'N',
      availability: 'N',
    };
    const result = calculateCvss(metrics);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(4.0);
    expect(result.severity).toBe('Low');
  });

  it('scope changed increases score for same CIA values', () => {
    const base: CvssMetrics = {
      attackVector: 'N',
      attackComplexity: 'L',
      privilegesRequired: 'N',
      userInteraction: 'N',
      scope: 'U',
      confidentiality: 'H',
      integrity: 'H',
      availability: 'H',
    };
    const changed: CvssMetrics = { ...base, scope: 'C' };
    const baseResult = calculateCvss(base);
    const changedResult = calculateCvss(changed);
    expect(changedResult.score).toBeGreaterThanOrEqual(baseResult.score);
  });

  it('exploitability is higher for network vs physical attack vector', () => {
    const network: CvssMetrics = { ...DEFAULT_METRICS, attackVector: 'N', confidentiality: 'H' };
    const physical: CvssMetrics = { ...DEFAULT_METRICS, attackVector: 'P', confidentiality: 'H' };
    const netResult = calculateCvss(network);
    const physResult = calculateCvss(physical);
    expect(netResult.exploitability).toBeGreaterThan(physResult.exploitability);
  });

  it('privileges required C weight differs between Unchanged and Changed scope', () => {
    // With scope Changed, PR:L weight is 0.68 vs 0.62 for Unchanged
    const unchanged: CvssMetrics = { ...DEFAULT_METRICS, scope: 'U', privilegesRequired: 'L', confidentiality: 'H' };
    const changed: CvssMetrics = { ...DEFAULT_METRICS, scope: 'C', privilegesRequired: 'L', confidentiality: 'H' };
    const u = calculateCvss(unchanged);
    const c = calculateCvss(changed);
    // Changed scope should give a different (generally higher) score
    expect(c.score).not.toEqual(u.score);
  });
});
