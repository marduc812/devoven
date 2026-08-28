import { parseBcryptHash, formatBcryptInfo } from '@/Components/Functions/BcryptInfoTools/logic';

const VALID_HASH = '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

describe('parseBcryptHash', () => {
  it('parses a valid $2b hash', () => {
    const result = parseBcryptHash(VALID_HASH);
    expect(result.valid).toBe(true);
    expect(result.version).toBe('$2b');
    expect(result.costFactor).toBe(12);
    expect(result.rounds).toBe(4096);
  });

  it('extracts salt (22 chars)', () => {
    const result = parseBcryptHash(VALID_HASH);
    expect(result.saltBase64).toHaveLength(22);
  });

  it('extracts hash (31 chars)', () => {
    const result = parseBcryptHash(VALID_HASH);
    expect(result.hashBase64).toHaveLength(31);
  });

  it('returns invalid for non-bcrypt string', () => {
    const result = parseBcryptHash('notabcrypt');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for unsupported version', () => {
    const result = parseBcryptHash('$3b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for too-short encoded section', () => {
    const result = parseBcryptHash('$2b$12$tooshort');
    expect(result.valid).toBe(false);
  });

  it('returns invalid for bad cost factor', () => {
    const result = parseBcryptHash('$2b$50$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');
    expect(result.valid).toBe(false);
  });

  it('correctly computes rounds as 2^costFactor', () => {
    const result = parseBcryptHash(VALID_HASH);
    expect(result.rounds).toBe(Math.pow(2, result.costFactor));
  });

  it('saltHex is a valid hex string', () => {
    const result = parseBcryptHash(VALID_HASH);
    expect(result.valid).toBe(true);
    expect(/^[0-9a-f]+$/.test(result.saltHex)).toBe(true);
  });
});

describe('formatBcryptInfo', () => {
  it('formats a valid hash info', () => {
    const info = parseBcryptHash(VALID_HASH);
    const formatted = formatBcryptInfo(info);
    expect(formatted).toContain('Version');
    expect(formatted).toContain('$2b');
    expect(formatted).toContain('Cost Factor');
    expect(formatted).toContain('12');
  });

  it('formats an error for invalid hash', () => {
    const info = parseBcryptHash('invalid');
    const formatted = formatBcryptInfo(info);
    expect(formatted).toContain('Error');
  });
});
