import { adler32, crc32, xxHash32, computeAllHashes } from '@/Components/Functions/MultiHashTools/logic';

describe('adler32', () => {
  it('returns 1 for empty string', () => expect(adler32('')).toBe(1));
  it('returns correct value for "Wikipedia"', () => {
    // Known Adler-32 for "Wikipedia" = 0x11E60398
    expect(adler32('Wikipedia')).toBe(0x11E60398);
  });
  it('returns a positive number', () => expect(adler32('hello')).toBeGreaterThan(0));
  it('different inputs produce different values', () => {
    expect(adler32('foo')).not.toBe(adler32('bar'));
  });
});

describe('crc32', () => {
  it('standard test vector: 123456789 = 0xCBF43926', () => {
    expect(crc32('123456789')).toBe(0xCBF43926);
  });
  it('returns unsigned 32-bit integer', () => {
    const r = crc32('test');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(0xFFFFFFFF);
  });
});

describe('xxHash32', () => {
  it('returns a number', () => expect(typeof xxHash32('hello')).toBe('number'));
  it('returns 0 or positive integer', () => expect(xxHash32('test')).toBeGreaterThanOrEqual(0));
  it('different inputs produce different results', () => {
    expect(xxHash32('abc')).not.toBe(xxHash32('xyz'));
  });
});

describe('computeAllHashes', () => {
  it('returns 9 hash results', () => {
    const results = computeAllHashes('hello', '');
    expect(results).toHaveLength(9);
  });

  it('includes MD5, SHA-1, SHA-256', () => {
    const results = computeAllHashes('hello', '');
    const names = results.map(r => r.algorithm);
    expect(names).toContain('MD5');
    expect(names).toContain('SHA-1');
    expect(names).toContain('SHA-256');
  });

  it('matches is null when no expected hash provided', () => {
    const results = computeAllHashes('hello', '');
    results.forEach(r => expect(r.matches).toBeNull());
  });

  it('marks correct match when expected hash matches', () => {
    // MD5 of empty string is d41d8cd98f00b204e9800998ecf8427e
    const results = computeAllHashes('', 'd41d8cd98f00b204e9800998ecf8427e');
    const md5Result = results.find(r => r.algorithm === 'MD5');
    expect(md5Result).toBeDefined();
    expect(md5Result!.matches).toBe(true);
  });

  it('does not match wrong algorithm', () => {
    const results = computeAllHashes('hello', 'd41d8cd98f00b204e9800998ecf8427e');
    const sha256Result = results.find(r => r.algorithm === 'SHA-256');
    expect(sha256Result!.matches).toBe(false);
  });
});
