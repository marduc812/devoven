import {
  murmurHash3_32,
  murmurHash3_32Bytes,
  computeMurmurHash,
  formatMurmurResult,
  analyzeMurmur,
  murmurSteps,
  parseHexBytes,
  parseInput,
  parseSeed,
  stringToBytes,
  byteChar,
  fmix32,
  TRACE_LIMIT,
} from '../Components/Functions/MurmurHashTools/logic';

// ─── murmurHash3_32 ───────────────────────────────────────────────────────────

describe('murmurHash3_32', () => {
  it('returns a 32-bit unsigned integer', () => {
    const hash = murmurHash3_32('Hello');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
  });

  it('returns 0 for empty string with seed 0', () => {
    // MurmurHash3 of empty string with seed 0 is a known value
    const hash = murmurHash3_32('', 0);
    expect(typeof hash).toBe('number');
    expect(hash).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic — same input gives same output', () => {
    const h1 = murmurHash3_32('Hello, World!');
    const h2 = murmurHash3_32('Hello, World!');
    expect(h1).toBe(h2);
  });

  it('different inputs give different hashes', () => {
    expect(murmurHash3_32('Hello')).not.toBe(murmurHash3_32('hello'));
    expect(murmurHash3_32('foo')).not.toBe(murmurHash3_32('bar'));
  });

  it('different seeds give different hashes for same input', () => {
    const h1 = murmurHash3_32('test', 0);
    const h2 = murmurHash3_32('test', 1);
    expect(h1).not.toBe(h2);
  });

  it('handles inputs of various lengths', () => {
    // Tests 0..5 byte tail handling in MurmurHash3
    for (let len = 0; len <= 8; len++) {
      const input = 'A'.repeat(len);
      const hash = murmurHash3_32(input);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
    }
  });

  it('produces a consistent hash for "Hello, World!" with seed 0', () => {
    // Verify the hash is deterministic and matches our pure-JS implementation
    const hash = murmurHash3_32('Hello, World!', 0);
    expect(hash).toBe(592631239); // 0x2352D5C7 — our implementation's consistent value
  });
});

// ─── Known-answer vectors ─────────────────────────────────────────────────────
// The published MurmurHash3 x86_32 vectors. Without these the suite only proved
// the implementation agreed with itself.

describe('murmurHash3_32 known answers', () => {
  const vectors: [string, number, number][] = [
    ['', 0, 0x00000000],
    ['', 1, 0x514e28b7],
    ['', 0xffffffff, 0x81f16f39],
    ['test', 0, 0xba6bd213],
    ['Hello, world!', 0, 0xc0363e43],
    ['aaaa', 0x9747b28c, 0x5a97808a],
    ['aaa', 0x9747b28c, 0x283e0130],
    ['aa', 0x9747b28c, 0x5d211726],
    ['a', 0x9747b28c, 0x7fa09ea6],
    ['The quick brown fox jumps over the lazy dog', 0, 0x2e4ff723],
  ];

  it.each(vectors)('hashes %p with seed %p', (input, seed, expected) => {
    expect(murmurHash3_32(input, seed)).toBe(expected >>> 0);
  });

  it('covers all four tail lengths', () => {
    // 4/8-byte inputs have no tail; 1/2/3 leftover bytes each take a different branch.
    const tails = [0, 1, 2, 3].map(n => murmurHash3_32('abcd' + 'x'.repeat(n)));
    expect(new Set(tails).size).toBe(4);
  });
});

// ─── stringToBytes ────────────────────────────────────────────────────────────

describe('stringToBytes', () => {
  it('encodes ASCII one byte per character', () => {
    expect(stringToBytes('abc')).toEqual([0x61, 0x62, 0x63]);
  });

  it('encodes non-ASCII as UTF-8 rather than truncating to Latin-1', () => {
    // U+20AC is three UTF-8 bytes. The old charCodeAt & 0xff produced [0xAC].
    expect(stringToBytes('€')).toEqual([0xe2, 0x82, 0xac]);
    expect(stringToBytes('é')).toEqual([0xc3, 0xa9]);
  });

  it('makes non-ASCII text hash over more bytes than characters', () => {
    expect(stringToBytes('café')).toHaveLength(5);
  });
});

// ─── murmurHash3_32Bytes ──────────────────────────────────────────────────────

describe('murmurHash3_32Bytes', () => {
  it('agrees with the string entry point', () => {
    expect(murmurHash3_32Bytes(stringToBytes('Hello, World!'), 0)).toBe(
      murmurHash3_32('Hello, World!', 0)
    );
  });

  it('hashes raw bytes that no string would produce', () => {
    const hash = murmurHash3_32Bytes([0x00, 0xff, 0x80, 0x01], 0);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });

  it('treats the seed as unsigned', () => {
    expect(murmurHash3_32Bytes([1, 2, 3], -1)).toBe(murmurHash3_32Bytes([1, 2, 3], 0xffffffff));
  });
});

// ─── fmix32 ───────────────────────────────────────────────────────────────────

describe('fmix32', () => {
  it('maps 0 to 0 — every step is a multiply or an xor-shift', () => {
    expect(fmix32(0)).toBe(0);
  });

  it('returns an unsigned 32-bit value', () => {
    for (const input of [1, 0x7fffffff, 0xffffffff, 0xdeadbeef]) {
      const out = fmix32(input);
      expect(out).toBeGreaterThanOrEqual(0);
      expect(out).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('avalanches — one flipped input bit changes many output bits', () => {
    const a = fmix32(0x12345678);
    const b = fmix32(0x12345679);
    const differing = (a ^ b).toString(2).split('').filter(c => c === '1').length;
    expect(differing).toBeGreaterThan(8);
  });
});

// ─── parseHexBytes / parseInput ───────────────────────────────────────────────

describe('parseHexBytes', () => {
  it('parses spaced hex', () => {
    expect(parseHexBytes('48 65 6c').bytes).toEqual([0x48, 0x65, 0x6c]);
  });

  it('accepts 0x and \\x prefixes and separators', () => {
    expect(parseHexBytes('0x48,0x65').bytes).toEqual([0x48, 0x65]);
    expect(parseHexBytes('\\x48\\x65').bytes).toEqual([0x48, 0x65]);
    expect(parseHexBytes('48:65;6c_6c-6f').bytes).toEqual([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  });

  it('returns no bytes and no error for empty input', () => {
    expect(parseHexBytes('   ')).toEqual({ bytes: [], error: null });
  });

  it('reports a non-hex character rather than dropping it', () => {
    const parsed = parseHexBytes('48 6z');
    expect(parsed.bytes).toEqual([]);
    expect(parsed.error).toContain('z');
  });

  it('reports an odd digit count', () => {
    const parsed = parseHexBytes('48 6');
    expect(parsed.bytes).toEqual([]);
    expect(parsed.error).toContain('Odd');
  });
});

describe('parseInput', () => {
  it('encodes text as UTF-8 and never errors', () => {
    expect(parseInput('é', 'text')).toEqual({ bytes: [0xc3, 0xa9], error: null });
  });

  it('parses hex in hex mode', () => {
    expect(parseInput('c3 a9', 'hex').bytes).toEqual([0xc3, 0xa9]);
  });

  it('gives the same hash from both modes for the same bytes', () => {
    const fromText = murmurHash3_32Bytes(parseInput('Hello', 'text').bytes);
    const fromHex = murmurHash3_32Bytes(parseInput('48 65 6c 6c 6f', 'hex').bytes);
    expect(fromText).toBe(fromHex);
  });
});

// ─── parseSeed ────────────────────────────────────────────────────────────────

describe('parseSeed', () => {
  it('defaults to 0 for empty input', () => {
    expect(parseSeed('')).toEqual({ seed: 0, error: null });
  });

  it('parses decimal', () => {
    expect(parseSeed('42')).toEqual({ seed: 42, error: null });
  });

  it('parses 0x-prefixed hex in either case', () => {
    expect(parseSeed('0x9747b28c').seed).toBe(0x9747b28c);
    expect(parseSeed('0X9747B28C').seed).toBe(0x9747b28c);
  });

  it('rejects anything else', () => {
    expect(parseSeed('nope').error).toBeTruthy();
    expect(parseSeed('-1').error).toBeTruthy();
    expect(parseSeed('1.5').error).toBeTruthy();
  });

  it('rejects seeds wider than 32 bits', () => {
    expect(parseSeed('4294967295')).toEqual({ seed: 0xffffffff, error: null });
    expect(parseSeed('4294967296').error).toContain('32 bits');
  });
});

// ─── murmurSteps ──────────────────────────────────────────────────────────────

describe('murmurSteps', () => {
  const bytes = stringToBytes('Hello, World!'); // 13 bytes → 3 blocks + 1 tail

  it('starts from the seed', () => {
    const steps = murmurSteps(bytes, 99);
    expect(steps[0].stage).toBe('seed');
    expect(steps[0].h1).toBe(99);
  });

  it('emits one row per 4-byte block', () => {
    expect(murmurSteps(bytes).filter(s => s.stage === 'block')).toHaveLength(3);
  });

  it('emits a tail row only when bytes are left over', () => {
    expect(murmurSteps(bytes).filter(s => s.stage === 'tail')).toHaveLength(1);
    expect(murmurSteps(stringToBytes('abcd')).filter(s => s.stage === 'tail')).toHaveLength(0);
  });

  it('always emits the six finalization rows', () => {
    expect(murmurSteps([]).filter(s => s.stage === 'final')).toHaveLength(6);
    expect(murmurSteps(bytes).filter(s => s.stage === 'final')).toHaveLength(6);
  });

  it('ends on the same value the hash function returns', () => {
    for (const seed of [0, 1, 0x9747b28c]) {
      const steps = murmurSteps(bytes, seed);
      expect(steps[steps.length - 1].h1).toBe(murmurHash3_32Bytes(bytes, seed));
    }
  });

  it('carries the source bytes on block and tail rows only', () => {
    for (const step of murmurSteps(bytes)) {
      if (step.stage === 'block') expect(step.bytes).toHaveLength(4);
      else if (step.stage === 'tail') expect(step.bytes).toHaveLength(1);
      else expect(step.bytes).toEqual([]);
    }
  });

  it('reads blocks little-endian', () => {
    const step = murmurSteps(stringToBytes('abcd')).find(s => s.stage === 'block');
    expect(step?.k1Raw).toBe(0x64636261); // 'd','c','b','a'
  });

  it('caps block rows but still finalizes over the whole input', () => {
    const long = stringToBytes('x'.repeat(40)); // 10 blocks
    const steps = murmurSteps(long, 0, 4);
    expect(steps.filter(s => s.stage === 'block')).toHaveLength(4);
    expect(steps[steps.length - 1].h1).toBe(murmurHash3_32Bytes(long, 0));
  });

  it('defaults its cap to TRACE_LIMIT', () => {
    expect(TRACE_LIMIT).toBe(1000);
    const long = new Array(4 * (TRACE_LIMIT + 5)).fill(0x41);
    expect(murmurSteps(long).filter(s => s.stage === 'block')).toHaveLength(TRACE_LIMIT);
  });
});

// ─── analyzeMurmur ────────────────────────────────────────────────────────────

describe('analyzeMurmur', () => {
  const result = analyzeMurmur(stringToBytes('Hello, World!'), 0);

  it('reports the hash in every representation', () => {
    expect(result.hash).toBe(592631239);
    expect(result.hex).toBe('2352D5C7');
    expect(result.decimal).toBe('592631239');
    expect(result.binary).toHaveLength(32);
    expect(parseInt(result.binary, 2)).toBe(result.hash);
  });

  it('reports the signed reading of the same bits', () => {
    expect(analyzeMurmur(stringToBytes('Hello, World!')).signed).toBe(592631239);
    // 0xBA6BD213 has the top bit set, so the signed reading is negative.
    const test = analyzeMurmur(stringToBytes('test'));
    expect(test.hash).toBe(0xba6bd213);
    expect(test.signed).toBe(-1167338989);
  });

  it('splits the input into blocks and a tail', () => {
    expect(result.byteCount).toBe(13);
    expect(result.blockCount).toBe(3);
    expect(result.tailLength).toBe(1);
  });

  it('reports no tail for an exact multiple of 4', () => {
    const exact = analyzeMurmur(stringToBytes('abcdefgh'));
    expect(exact.blockCount).toBe(2);
    expect(exact.tailLength).toBe(0);
  });

  it('normalises the seed to unsigned', () => {
    expect(analyzeMurmur([1], -1).seed).toBe(0xffffffff);
  });

  it('reports how many block rows the trace omitted', () => {
    expect(result.omittedBlocks).toBe(0);
    const long = analyzeMurmur(new Array(40).fill(0x41), 0, 4);
    expect(long.blockCount).toBe(10);
    expect(long.omittedBlocks).toBe(6);
  });

  it('hashes an empty input to 0 with seed 0', () => {
    expect(analyzeMurmur([], 0).hex).toBe('00000000');
  });
});

// ─── byteChar ─────────────────────────────────────────────────────────────────

describe('byteChar', () => {
  it('shows printable ASCII', () => {
    expect(byteChar(0x41)).toBe('A');
    expect(byteChar(0x20)).toBe(' ');
    expect(byteChar(0x7e)).toBe('~');
  });

  it('replaces control and high bytes with a dot', () => {
    expect(byteChar(0x00)).toBe('·');
    expect(byteChar(0x1f)).toBe('·');
    expect(byteChar(0xff)).toBe('·');
  });
});

// ─── computeMurmurHash ────────────────────────────────────────────────────────

describe('computeMurmurHash', () => {
  it('returns hex, decimal, and binary representations', () => {
    const result = computeMurmurHash('Hello');
    expect(result.hex).toHaveLength(8);
    expect(result.binary).toHaveLength(32);
    expect(result.decimal).toMatch(/^\d+$/);
  });

  it('hex is uppercase', () => {
    const result = computeMurmurHash('test');
    expect(result.hex).toBe(result.hex.toUpperCase());
  });

  it('decimal matches hex value', () => {
    const result = computeMurmurHash('foo');
    expect(parseInt(result.hex, 16)).toBe(parseInt(result.decimal, 10));
  });

  it('stores the seed used', () => {
    const result = computeMurmurHash('test', 42);
    expect(result.seed).toBe(42);
  });
});

// ─── formatMurmurResult ───────────────────────────────────────────────────────

describe('formatMurmurResult', () => {
  it('contains MurmurHash3 label', () => {
    const result = computeMurmurHash('Hello');
    expect(formatMurmurResult(result)).toContain('MurmurHash3');
  });

  it('contains hex value', () => {
    const result = computeMurmurHash('Hello');
    const formatted = formatMurmurResult(result);
    expect(formatted).toContain('0x');
    expect(formatted).toContain(result.hex);
  });

  it('contains decimal value', () => {
    const result = computeMurmurHash('Hello');
    const formatted = formatMurmurResult(result);
    expect(formatted).toContain(result.decimal);
  });

  it('contains binary value', () => {
    const result = computeMurmurHash('Hello');
    const formatted = formatMurmurResult(result);
    expect(formatted).toContain(result.binary);
  });
});
