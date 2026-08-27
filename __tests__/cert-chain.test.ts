import {
  splitPems,
  analyzeChain,
} from '../Components/Functions/CertChainTools/logic';

describe('splitPems', () => {
  it('returns empty array for empty input', () => {
    expect(splitPems('')).toEqual([]);
  });

  it('returns empty array for no PEM blocks', () => {
    expect(splitPems('hello world')).toEqual([]);
  });

  it('finds a single PEM block', () => {
    const pem = '-----BEGIN CERTIFICATE-----\naGVsbG8=\n-----END CERTIFICATE-----';
    const result = splitPems(pem);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('BEGIN CERTIFICATE');
  });

  it('finds multiple PEM blocks', () => {
    const pem = [
      '-----BEGIN CERTIFICATE-----\naGVsbG8=\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nd29ybGQ=\n-----END CERTIFICATE-----',
    ].join('\n\n');
    const result = splitPems(pem);
    expect(result).toHaveLength(2);
  });
});

describe('analyzeChain', () => {
  it('returns error for empty input', () => {
    const result = analyzeChain('');
    expect(result.certs).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error for non-PEM input', () => {
    const result = analyzeChain('not a cert');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles parse errors gracefully', () => {
    const fakePem = '-----BEGIN CERTIFICATE-----\naGVsbG8=\n-----END CERTIFICATE-----';
    const result = analyzeChain(fakePem);
    // Should not throw, may have errors
    expect(Array.isArray(result.certs)).toBe(true);
  });
});
