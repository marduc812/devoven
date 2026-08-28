import {
  base62EncodeText,
  base62DecodeText,
  base62EncodeNumber,
  base62DecodeNumber,
  isLikelyBase62Encoded,
  BASE62_ALPHABET,
} from '../Components/Functions/Base62Tools/logic';

// ─── base62EncodeText ─────────────────────────────────────────────────────────

describe('base62EncodeText', () => {
  it('encodes "Hello" to only Base62 chars', () => {
    const result = base62EncodeText('Hello');
    expect(result.length).toBeGreaterThan(0);
    for (const ch of result) {
      expect(BASE62_ALPHABET).toContain(ch);
    }
  });

  it('returns empty string for empty input', () => {
    expect(base62EncodeText('')).toBe('');
  });

  it('encodes null bytes as leading 0s', () => {
    const result = base62EncodeText('\x00\x00');
    expect(result).toBe('00');
  });

  it('round-trips simple strings', () => {
    expect(base62DecodeText(base62EncodeText('Hello'))).toBe('Hello');
    expect(base62DecodeText(base62EncodeText('abc123'))).toBe('abc123');
  });
});

// ─── base62DecodeText ─────────────────────────────────────────────────────────

describe('base62DecodeText', () => {
  it('round-trips a longer string', () => {
    const str = 'The quick brown fox';
    expect(base62DecodeText(base62EncodeText(str))).toBe(str);
  });

  it('returns empty string for empty input', () => {
    expect(base62DecodeText('')).toBe('');
    expect(base62DecodeText('   ')).toBe('');
  });

  it('throws on invalid Base62 characters', () => {
    expect(() => base62DecodeText('!@#')).toThrow();
  });
});

// ─── base62EncodeNumber ───────────────────────────────────────────────────────

describe('base62EncodeNumber', () => {
  it('encodes 0', () => {
    expect(base62EncodeNumber('0')).toBe('0');
  });

  it('encodes 62 as "10" (like binary 2)', () => {
    expect(base62EncodeNumber('62')).toBe('10');
  });

  it('encodes 61 as last char of alphabet', () => {
    expect(base62EncodeNumber('61')).toBe(BASE62_ALPHABET[61]);
  });

  it('encodes a large number to Base62 chars', () => {
    const result = base62EncodeNumber('1000000');
    expect(result.length).toBeGreaterThan(0);
    for (const ch of result) {
      expect(BASE62_ALPHABET).toContain(ch);
    }
  });

  it('returns empty string for empty input', () => {
    expect(base62EncodeNumber('')).toBe('');
    expect(base62EncodeNumber('   ')).toBe('');
  });

  it('throws for non-integer input', () => {
    expect(() => base62EncodeNumber('abc')).toThrow();
    expect(() => base62EncodeNumber('1.5')).toThrow();
  });
});

// ─── base62DecodeNumber ───────────────────────────────────────────────────────

describe('base62DecodeNumber', () => {
  it('decodes "0" to "0"', () => {
    expect(base62DecodeNumber('0')).toBe('0');
  });

  it('decodes "10" to "62"', () => {
    expect(base62DecodeNumber('10')).toBe('62');
  });

  it('round-trips numbers', () => {
    const nums = ['0', '1', '62', '100', '1000000', '9999999'];
    for (const n of nums) {
      expect(base62DecodeNumber(base62EncodeNumber(n))).toBe(n);
    }
  });

  it('returns empty string for empty input', () => {
    expect(base62DecodeNumber('')).toBe('');
    expect(base62DecodeNumber('   ')).toBe('');
  });

  it('throws on invalid Base62 characters', () => {
    expect(() => base62DecodeNumber('!@#')).toThrow();
  });
});

// ─── isLikelyBase62Encoded ────────────────────────────────────────────────────

describe('isLikelyBase62Encoded', () => {
  it('returns true for strings with alpha chars in Base62', () => {
    expect(isLikelyBase62Encoded('abc123')).toBe(true);
    expect(isLikelyBase62Encoded('ABC')).toBe(true);
  });

  it('returns false for all-numeric strings (could be plain numbers)', () => {
    expect(isLikelyBase62Encoded('12345')).toBe(false);
  });

  it('returns false for strings with invalid chars', () => {
    expect(isLikelyBase62Encoded('abc!')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLikelyBase62Encoded('')).toBe(false);
  });
});
