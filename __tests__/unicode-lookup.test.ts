import {
  codePointToUtf8Bytes,
  codePointToUtf16Units,
  analyzeChar,
  parseInput,
  analyzeInput,
} from '@/Components/Functions/UnicodeTools/logic';

describe('codePointToUtf8Bytes', () => {
  it('encodes ASCII as 1 byte', () => {
    expect(codePointToUtf8Bytes(0x41)).toEqual([0x41]); // 'A'
  });

  it('encodes 2-byte sequence', () => {
    // U+00E9 é = 0xC3 0xA9
    expect(codePointToUtf8Bytes(0xE9)).toEqual([0xC3, 0xA9]);
  });

  it('encodes 3-byte sequence', () => {
    // U+4E2D 中
    const bytes = codePointToUtf8Bytes(0x4E2D);
    expect(bytes).toHaveLength(3);
  });

  it('encodes 4-byte sequence', () => {
    // U+1F600 😀
    const bytes = codePointToUtf8Bytes(0x1F600);
    expect(bytes).toHaveLength(4);
  });
});

describe('codePointToUtf16Units', () => {
  it('encodes BMP char as 1 unit', () => {
    expect(codePointToUtf16Units(0x41)).toEqual([0x41]);
  });

  it('encodes supplementary plane as surrogate pair', () => {
    const units = codePointToUtf16Units(0x1F600);
    expect(units).toHaveLength(2);
    expect(units[0]).toBeGreaterThanOrEqual(0xD800);
    expect(units[0]).toBeLessThan(0xDC00);
    expect(units[1]).toBeGreaterThanOrEqual(0xDC00);
    expect(units[1]).toBeLessThan(0xE000);
  });
});

describe('analyzeChar', () => {
  it('produces correct code point string', () => {
    const info = analyzeChar(65);
    expect(info.codePointStr).toBe('U+0041');
  });

  it('produces HTML entity', () => {
    const info = analyzeChar(65);
    expect(info.htmlEntity).toBe('&#x0041;');
  });

  it('produces JS escape', () => {
    const info = analyzeChar(65);
    expect(info.jsEscape).toBe('\\u0041');
  });

  it('handles emoji code point', () => {
    const info = analyzeChar(0x1F600);
    expect(info.codePointStr).toBe('U+1F600');
    expect(info.utf8Bytes.split(' ')).toHaveLength(4);
  });
});

describe('parseInput', () => {
  it('parses U+XXXX notation', () => {
    expect(parseInput('U+0041')).toEqual([65]);
  });

  it('parses 0x hex notation', () => {
    expect(parseInput('0x41')).toEqual([65]);
  });

  it('parses decimal number', () => {
    expect(parseInput('65')).toEqual([65]);
  });

  it('parses a character string', () => {
    const result = parseInput('AB');
    expect(result).toEqual([65, 66]);
  });

  it('returns null for empty input', () => {
    expect(parseInput('')).toBeNull();
  });

  it('returns null for out-of-range code point', () => {
    expect(parseInput('U+200000')).toBeNull();
  });
});

describe('analyzeInput', () => {
  it('returns CharInfo array for valid input', () => {
    const result = analyzeInput('A');
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result[0].codePoint).toBe(65);
    }
  });

  it('returns error string for empty input', () => {
    const result = analyzeInput('');
    expect(typeof result === 'string' || result === null).toBe(true);
  });
});
