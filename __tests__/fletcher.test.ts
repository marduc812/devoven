import {
  computeFletcher16,
  computeFletcher32,
  computeAdler32,
  computeAll,
  computeAllFromBytes,
  formatFletcherResult,
  stringToBytes,
  parseHexBytes,
  parseInput,
  toWords,
  fletcher16Steps,
  fletcher32Steps,
  analyzeFletcher,
  byteChar,
  TRACE_LIMIT,
} from '../Components/Functions/FletcherTools/logic';

// ─── computeFletcher16 ────────────────────────────────────────────────────────

describe('computeFletcher16', () => {
  it('returns 0 checksum for empty array', () => {
    const { checksum } = computeFletcher16([]);
    expect(checksum).toBe(0);
  });

  it('computes Fletcher-16 for [1, 2]', () => {
    const { sum1, sum2, checksum } = computeFletcher16([1, 2]);
    expect(sum1).toBe(3); // (1+2) % 255
    expect(sum2).toBe(4); // (1 + 3) % 255
    expect(checksum).toBe((4 << 8) | 3);
  });

  it('sum1 and sum2 are in [0, 254]', () => {
    const bytes = Array.from({ length: 100 }, (_, i) => i);
    const { sum1, sum2 } = computeFletcher16(bytes);
    expect(sum1).toBeGreaterThanOrEqual(0);
    expect(sum1).toBeLessThan(255);
    expect(sum2).toBeGreaterThanOrEqual(0);
    expect(sum2).toBeLessThan(255);
  });

  it('produces a 16-bit checksum', () => {
    const { checksum } = computeFletcher16([0xAB, 0xCD]);
    expect(checksum).toBeGreaterThanOrEqual(0);
    expect(checksum).toBeLessThanOrEqual(0xFFFF);
  });

  it('is order-dependent (different orderings give different results)', () => {
    const r1 = computeFletcher16([1, 2, 3]);
    const r2 = computeFletcher16([3, 2, 1]);
    expect(r1.checksum).not.toBe(r2.checksum);
  });
});

// ─── computeFletcher32 ────────────────────────────────────────────────────────

describe('computeFletcher32', () => {
  it('returns 0 checksum for empty array', () => {
    const { checksum } = computeFletcher32([]);
    expect(checksum).toBe(0);
  });

  it('sum1 and sum2 are in [0, 65534]', () => {
    const bytes = Array.from({ length: 100 }, (_, i) => i);
    const { sum1, sum2 } = computeFletcher32(bytes);
    expect(sum1).toBeGreaterThanOrEqual(0);
    expect(sum1).toBeLessThan(65535);
    expect(sum2).toBeGreaterThanOrEqual(0);
    expect(sum2).toBeLessThan(65535);
  });

  it('produces a 32-bit checksum', () => {
    const { checksum } = computeFletcher32([0xAB, 0xCD, 0xEF]);
    expect(checksum).toBeGreaterThanOrEqual(0);
    expect(checksum).toBeLessThanOrEqual(0xFFFFFFFF);
  });

  it('handles odd-length byte arrays', () => {
    // Should not throw
    expect(() => computeFletcher32([1, 2, 3])).not.toThrow();
  });
});

// ─── computeAdler32 ───────────────────────────────────────────────────────────

describe('computeAdler32', () => {
  it('returns 1 for empty array (initial value)', () => {
    expect(computeAdler32([])).toBe(1);
  });

  it('produces a 32-bit result', () => {
    const result = computeAdler32([65, 66, 67]); // "ABC"
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(0xFFFFFFFF);
  });

  it('is different from Fletcher-32 for same input', () => {
    const bytes = [72, 101, 108, 108, 111]; // "Hello"
    const adler = computeAdler32(bytes);
    const { checksum: fletcher } = computeFletcher32(bytes);
    expect(adler).not.toBe(fletcher);
  });
});

// ─── computeAll ───────────────────────────────────────────────────────────────

describe('computeAll', () => {
  it('computes all checksums for "Hello"', () => {
    const result = computeAll('Hello');
    expect(result.fletcher16.hex).toHaveLength(4);
    expect(result.fletcher32.hex).toHaveLength(8);
    expect(result.adler32.hex).toHaveLength(8);
  });

  it('returns hex strings in uppercase', () => {
    const result = computeAll('test');
    expect(result.fletcher16.hex).toBe(result.fletcher16.hex.toUpperCase());
    expect(result.fletcher32.hex).toBe(result.fletcher32.hex.toUpperCase());
  });

  it('decimal values match hex for fletcher16', () => {
    const result = computeAll('abc');
    const parsed = parseInt(result.fletcher16.hex, 16);
    expect(parsed).toBe(result.fletcher16.decimal);
  });
});

// ─── formatFletcherResult ─────────────────────────────────────────────────────

describe('formatFletcherResult', () => {
  it('contains Fletcher-16 section', () => {
    const result = computeAll('Hello');
    const formatted = formatFletcherResult(result);
    expect(formatted).toContain('Fletcher-16');
  });

  it('contains Fletcher-32 section', () => {
    const result = computeAll('Hello');
    const formatted = formatFletcherResult(result);
    expect(formatted).toContain('Fletcher-32');
  });

  it('contains Adler-32 section', () => {
    const result = computeAll('Hello');
    const formatted = formatFletcherResult(result);
    expect(formatted).toContain('Adler-32');
  });

  it('contains hex output', () => {
    const result = computeAll('Hello');
    const formatted = formatFletcherResult(result);
    expect(formatted).toContain('0x');
  });
});

// ─── Known-answer vectors ─────────────────────────────────────────────────────

describe('published test vectors', () => {
  it('Fletcher-16 of "abcde" is 0xC8F0', () => {
    expect(computeAll('abcde').fletcher16.hex).toBe('C8F0');
  });

  it('Fletcher-16 of "abcdef" is 0x2057', () => {
    expect(computeAll('abcdef').fletcher16.hex).toBe('2057');
  });

  it('Adler-32 of "Wikipedia" is 0x11E60398', () => {
    expect(computeAll('Wikipedia').adler32.hex).toBe('11E60398');
  });
});

// ─── stringToBytes ────────────────────────────────────────────────────────────

describe('stringToBytes', () => {
  it('leaves ASCII one byte per character', () => {
    expect(stringToBytes('abc')).toEqual([97, 98, 99]);
  });

  it('encodes non-ASCII as UTF-8 rather than truncating the code point', () => {
    // U+20AC EURO SIGN — truncating to 8 bits would give the single byte 0xAC.
    expect(stringToBytes('€')).toEqual([0xe2, 0x82, 0xac]);
  });

  it('encodes characters outside the BMP', () => {
    expect(stringToBytes('😀')).toEqual([0xf0, 0x9f, 0x98, 0x80]);
  });

  it('returns no bytes for an empty string', () => {
    expect(stringToBytes('')).toEqual([]);
  });
});

// ─── parseHexBytes ────────────────────────────────────────────────────────────

describe('parseHexBytes', () => {
  it('parses space-separated bytes', () => {
    expect(parseHexBytes('48 65 6c').bytes).toEqual([0x48, 0x65, 0x6c]);
  });

  it('parses a run with no separators', () => {
    expect(parseHexBytes('48656c').bytes).toEqual([0x48, 0x65, 0x6c]);
  });

  it('accepts 0x, \\x, comma and colon separators', () => {
    expect(parseHexBytes('0x48, 0x65\n\\x6c:6C').bytes).toEqual([0x48, 0x65, 0x6c, 0x6c]);
  });

  it('is case-insensitive', () => {
    expect(parseHexBytes('AbCd').bytes).toEqual([0xab, 0xcd]);
  });

  it('rejects an odd number of digits', () => {
    const { bytes, error } = parseHexBytes('48 6');
    expect(bytes).toEqual([]);
    expect(error).toMatch(/odd number/i);
  });

  it('rejects non-hex characters instead of dropping them', () => {
    const { bytes, error } = parseHexBytes('48 zz');
    expect(bytes).toEqual([]);
    expect(error).toMatch(/not a hex digit/i);
  });

  it('treats empty input as zero bytes, not an error', () => {
    expect(parseHexBytes('   ')).toEqual({ bytes: [], error: null });
  });
});

// ─── parseInput ───────────────────────────────────────────────────────────────

describe('parseInput', () => {
  it('routes text mode through the UTF-8 encoder', () => {
    expect(parseInput('abc', 'text').bytes).toEqual([97, 98, 99]);
  });

  it('routes hex mode through the hex parser', () => {
    expect(parseInput('61 62 63', 'hex').bytes).toEqual([97, 98, 99]);
  });

  it('never errors in text mode', () => {
    expect(parseInput('zz not hex at all', 'text').error).toBeNull();
  });
});

// ─── toWords ──────────────────────────────────────────────────────────────────

describe('toWords', () => {
  it('packs byte pairs big-endian', () => {
    expect(toWords([0xab, 0xcd])).toEqual([0xabcd]);
  });

  it('zero-pads a trailing odd byte', () => {
    expect(toWords([0xab, 0xcd, 0xef])).toEqual([0xabcd, 0xef00]);
  });

  it('returns no words for no bytes', () => {
    expect(toWords([])).toEqual([]);
  });
});

// ─── Step traces ──────────────────────────────────────────────────────────────

describe('fletcher16Steps', () => {
  it('emits one step per byte', () => {
    expect(fletcher16Steps([1, 2, 3])).toHaveLength(3);
  });

  it('ends on the same sums as computeFletcher16', () => {
    const bytes = stringToBytes('abcde');
    const steps = fletcher16Steps(bytes);
    const { sum1, sum2 } = computeFletcher16(bytes);
    expect(steps[steps.length - 1]).toMatchObject({ sum1, sum2 });
  });

  it('records the byte folded in at each step', () => {
    expect(fletcher16Steps([7, 9]).map(s => s.value)).toEqual([7, 9]);
  });

  it('caps the trace at TRACE_LIMIT steps', () => {
    const bytes = new Array(TRACE_LIMIT + 500).fill(1);
    expect(fletcher16Steps(bytes)).toHaveLength(TRACE_LIMIT);
  });

  it('honours an explicit limit', () => {
    expect(fletcher16Steps([1, 2, 3, 4], 2)).toHaveLength(2);
  });
});

describe('fletcher32Steps', () => {
  it('emits one step per 16-bit word', () => {
    expect(fletcher32Steps([1, 2, 3])).toHaveLength(2);
  });

  it('ends on the same sums as computeFletcher32', () => {
    const bytes = stringToBytes('Hello, World!');
    const steps = fletcher32Steps(bytes);
    const { sum1, sum2 } = computeFletcher32(bytes);
    expect(steps[steps.length - 1]).toMatchObject({ sum1, sum2 });
  });

  it('caps the trace at TRACE_LIMIT steps', () => {
    const bytes = new Array(TRACE_LIMIT * 2 + 500).fill(1);
    expect(fletcher32Steps(bytes)).toHaveLength(TRACE_LIMIT);
  });
});

// ─── analyzeFletcher ──────────────────────────────────────────────────────────

describe('analyzeFletcher', () => {
  it('agrees with computeAll for the same bytes', () => {
    const bytes = stringToBytes('abcde');
    expect(analyzeFletcher(bytes).fletcher16).toEqual(computeAll('abcde').fletcher16);
  });

  it('counts bytes and words', () => {
    const result = analyzeFletcher([1, 2, 3]);
    expect(result.byteCount).toBe(3);
    expect(result.wordCount).toBe(2);
  });

  it('flags padding only for odd-length input', () => {
    expect(analyzeFletcher([1, 2, 3]).padded).toBe(true);
    expect(analyzeFletcher([1, 2]).padded).toBe(false);
  });

  it('reports an empty message without throwing', () => {
    const result = analyzeFletcher([]);
    expect(result.byteCount).toBe(0);
    expect(result.fletcher16.hex).toBe('0000');
    expect(result.adler32.decimal).toBe(1);
    expect(result.steps16).toEqual([]);
  });

  it('flags a truncated trace past TRACE_LIMIT', () => {
    expect(analyzeFletcher(new Array(10).fill(1)).stepsTruncated).toBe(false);
    expect(analyzeFletcher(new Array(TRACE_LIMIT + 1).fill(1)).stepsTruncated).toBe(true);
  });
});

// ─── computeAllFromBytes ──────────────────────────────────────────────────────

describe('computeAllFromBytes', () => {
  it('matches computeAll on the encoded string', () => {
    expect(computeAllFromBytes(stringToBytes('test'))).toEqual(computeAll('test'));
  });
});

// ─── byteChar ─────────────────────────────────────────────────────────────────

describe('byteChar', () => {
  it('renders printable ASCII as itself', () => {
    expect(byteChar(0x41)).toBe('A');
    expect(byteChar(0x20)).toBe(' ');
  });

  it('renders control and high bytes as a dot', () => {
    expect(byteChar(0x00)).toBe('·');
    expect(byteChar(0x0a)).toBe('·');
    expect(byteChar(0xe2)).toBe('·');
  });
});
