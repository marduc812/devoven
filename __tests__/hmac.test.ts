import { generateHmac, generateAllHmacs } from '@/Components/Functions/HmacTools/logic';

describe('generateHmac SHA-256', () => {
  it('produces a 64-char hex string for SHA-256', () => {
    const result = generateHmac('hello', 'secret', 'SHA-256');
    expect(result.hex).toHaveLength(64);
    expect(result.byteLength).toBe(32);
    expect(result.algorithm).toBe('SHA-256');
  });

  it('produces consistent output for the same input', () => {
    const r1 = generateHmac('test message', 'mykey', 'SHA-256');
    const r2 = generateHmac('test message', 'mykey', 'SHA-256');
    expect(r1.hex).toBe(r2.hex);
  });

  it('produces different output for different keys', () => {
    const r1 = generateHmac('message', 'key1', 'SHA-256');
    const r2 = generateHmac('message', 'key2', 'SHA-256');
    expect(r1.hex).not.toBe(r2.hex);
  });

  it('produces different output for different messages', () => {
    const r1 = generateHmac('msg1', 'key', 'SHA-256');
    const r2 = generateHmac('msg2', 'key', 'SHA-256');
    expect(r1.hex).not.toBe(r2.hex);
  });
});

describe('generateHmac SHA-512', () => {
  it('produces a 128-char hex string for SHA-512', () => {
    const result = generateHmac('hello', 'secret', 'SHA-512');
    expect(result.hex).toHaveLength(128);
    expect(result.byteLength).toBe(64);
  });
});

describe('generateHmac SHA-1', () => {
  it('produces a 40-char hex string for SHA-1', () => {
    const result = generateHmac('hello', 'secret', 'SHA-1');
    expect(result.hex).toHaveLength(40);
    expect(result.byteLength).toBe(20);
  });
});

describe('generateHmac MD5', () => {
  it('produces a 32-char hex string for MD5', () => {
    const result = generateHmac('hello', 'secret', 'MD5');
    expect(result.hex).toHaveLength(32);
    expect(result.byteLength).toBe(16);
  });
});

describe('generateAllHmacs', () => {
  it('returns 4 results for valid input', () => {
    const results = generateAllHmacs('test', 'key');
    expect(results).toHaveLength(4);
  });

  it('returns empty array for empty message', () => {
    expect(generateAllHmacs('', 'key')).toHaveLength(0);
  });

  it('returns empty array for empty key', () => {
    expect(generateAllHmacs('msg', '')).toHaveLength(0);
  });

  it('base64 output is non-empty', () => {
    const results = generateAllHmacs('hello', 'world');
    for (const r of results) {
      expect(r.base64.length).toBeGreaterThan(0);
    }
  });
});
