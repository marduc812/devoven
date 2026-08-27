import { crc32, formatCrc32 } from '@/Components/Functions/Crc32Tools/logic';

describe('crc32', () => {
  it('returns 0 for empty string', () => expect(crc32('')).toBe(0));
  it('calculates CRC32 for "hello"', () => expect(crc32('hello')).toBe(0x3610A686));
  it('calculates CRC32 for "123456789" (standard test vector)', () => {
    expect(crc32('123456789')).toBe(0xCBF43926);
  });
  it('returns a positive 32-bit integer', () => {
    const r = crc32('test');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(0xFFFFFFFF);
  });
  it('different inputs give different results', () => {
    expect(crc32('foo')).not.toBe(crc32('bar'));
  });
});

describe('formatCrc32', () => {
  it('includes 0x prefix in hex output', () => expect(formatCrc32('hello')).toContain('0x'));
  it('includes Decimal label', () => expect(formatCrc32('test')).toContain('Decimal:'));
  it('CRC32 for 123456789 is CBF43926', () => expect(formatCrc32('123456789')).toContain('CBF43926'));
});
