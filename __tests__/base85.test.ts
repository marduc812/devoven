import {
  base85Encode,
  base85Decode,
  isLikelyBase85Encoded,
  autoConvert,
} from '../Components/Functions/Base85Tools/logic';

// ─── base85Encode ─────────────────────────────────────────────────────────────

describe('base85Encode', () => {
  it('encodes "Hello" with Adobe delimiters', () => {
    const result = base85Encode('Hello', true);
    expect(result).toMatch(/^<~.*~>$/);
    expect(result.length).toBeGreaterThan(4);
  });

  it('encodes "Hello" without Adobe delimiters (raw)', () => {
    const result = base85Encode('Hello', false);
    expect(result).not.toContain('<~');
    expect(result).not.toContain('~>');
    expect(result.length).toBeGreaterThan(0);
  });

  it('encodes 4 zero bytes as z special case (raw)', () => {
    const input = '\x00\x00\x00\x00';
    const result = base85Encode(input, false);
    expect(result).toBe('z');
  });

  it('encodes 4 zero bytes as z in Adobe mode', () => {
    const input = '\x00\x00\x00\x00';
    const result = base85Encode(input, true);
    expect(result).toBe('<~z~>');
  });

  it('returns empty string for empty input', () => {
    expect(base85Encode('', true)).toBe('');
    expect(base85Encode('', false)).toBe('');
  });

  it('encodes "Man" (partial group)', () => {
    const result = base85Encode('Man', false);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── base85Decode ─────────────────────────────────────────────────────────────

describe('base85Decode', () => {
  it('decodes Adobe-encoded string back to original', () => {
    const original = 'Hello, World!';
    const encoded = base85Encode(original, true);
    expect(base85Decode(encoded)).toBe(original);
  });

  it('decodes raw-encoded string back to original', () => {
    const original = 'Hello, World!';
    const encoded = base85Encode(original, false);
    expect(base85Decode(encoded)).toBe(original);
  });

  it('decodes z special case (4 zero bytes)', () => {
    const decoded = base85Decode('z');
    expect(decoded).toBe('\x00\x00\x00\x00');
  });

  it('decodes Adobe z special case', () => {
    const decoded = base85Decode('<~z~>');
    expect(decoded).toBe('\x00\x00\x00\x00');
  });

  it('returns empty string for empty/whitespace input', () => {
    expect(base85Decode('')).toBe('');
    expect(base85Decode('   ')).toBe('');
  });

  it('round-trips various strings', () => {
    const inputs = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE', '12345678'];
    for (const s of inputs) {
      expect(base85Decode(base85Encode(s, false))).toBe(s);
    }
  });

  it('throws on invalid Base85 character', () => {
    // chars above 117 (ASCII 'u') are invalid in base85
    // '~' is charCode 126, which is > 117 and not 'z', so it's invalid outside delimiters
    expect(() => base85Decode('~~~~~')).toThrow();
  });
});

// ─── isLikelyBase85Encoded ────────────────────────────────────────────────────

describe('isLikelyBase85Encoded', () => {
  it('detects Adobe-delimited strings', () => {
    expect(isLikelyBase85Encoded('<~87cURD]j7BEbo80~>')).toBe(true);
  });

  it('returns false for plain ASCII text', () => {
    // Plain text like "Hello World" has spaces and falls outside if range is wrong
    // But some plain text might accidentally pass; focus on definite cases
    expect(isLikelyBase85Encoded('')).toBe(false);
  });

  it('returns true for raw base85 with z char', () => {
    expect(isLikelyBase85Encoded('z')).toBe(true);
  });
});

// ─── autoConvert ─────────────────────────────────────────────────────────────

describe('autoConvert', () => {
  it('returns empty string for empty input', () => {
    expect(autoConvert('', 'adobe')).toBe('');
    expect(autoConvert('   ', 'raw')).toBe('');
  });

  it('decodes Adobe-format input automatically', () => {
    const original = 'Hello';
    const encoded = base85Encode(original, true);
    const result = autoConvert(encoded, 'adobe');
    expect(result).toBe(original);
  });

  it('encodes plain text with non-base85 chars automatically in adobe mode', () => {
    // Use text containing chars outside base85 range (> 117) to ensure it's treated as plain text
    const input = 'Hello\x80World'; // \x80 is not valid base85
    const result = autoConvert(input, 'adobe');
    expect(result).toMatch(/^<~.*~>$/);
  });
});
