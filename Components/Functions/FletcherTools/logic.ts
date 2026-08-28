// ─── Fletcher Checksum ────────────────────────────────────────────────────────
// Fletcher-16: works on bytes (8-bit words), mod 255
// Fletcher-32: works on 16-bit words, mod 65535
// Compare with Adler-32 (similar but different offset and modulus).

export interface FletcherResult {
  fletcher16: {
    hex: string;
    decimal: number;
    binary: string;
    sum1: number;
    sum2: number;
  };
  fletcher32: {
    hex: string;
    decimal: number;
    binary: string;
    sum1: number;
    sum2: number;
  };
  adler32: {
    hex: string;
    decimal: number;
    binary: string;
  };
}

/**
 * A checksum is defined over bytes, so text has to be encoded first. UTF-8 is
 * what every other implementation would see on the wire; the previous
 * `charCodeAt(i) & 0xff` silently truncated anything outside Latin-1 (U+20AC
 * became 0xAC) and produced checksums that matched nothing.
 */
export function stringToBytes(str: string): number[] {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(str));
  }
  // Node < 11 / exotic runtimes: fall back to code units.
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

export function computeFletcher16(bytes: number[]): { sum1: number; sum2: number; checksum: number } {
  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < bytes.length; i++) {
    sum1 = (sum1 + bytes[i]) % 255;
    sum2 = (sum2 + sum1) % 255;
  }
  const checksum = (sum2 << 8) | sum1;
  return { sum1, sum2, checksum };
}

export function computeFletcher32(bytes: number[]): { sum1: number; sum2: number; checksum: number } {
  let sum1 = 0;
  let sum2 = 0;

  // Work on 16-bit words; if odd number of bytes, pad with 0
  const len = bytes.length;
  for (let i = 0; i < len; i += 2) {
    const word = (bytes[i] << 8) | (i + 1 < len ? bytes[i + 1] : 0);
    sum1 = (sum1 + word) % 65535;
    sum2 = (sum2 + sum1) % 65535;
  }

  const checksum = (sum2 * 65536 + sum1) >>> 0;
  return { sum1, sum2, checksum };
}

export function computeAdler32(bytes: number[]): number {
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }
  return ((b * 65536) + a) >>> 0;
}

export function computeAll(input: string): FletcherResult {
  return computeAllFromBytes(stringToBytes(input));
}

export function computeAllFromBytes(bytes: number[]): FletcherResult {
  const f16 = computeFletcher16(bytes);
  const f32 = computeFletcher32(bytes);
  const adler = computeAdler32(bytes);

  return {
    fletcher16: {
      hex: f16.checksum.toString(16).toUpperCase().padStart(4, '0'),
      decimal: f16.checksum,
      binary: f16.checksum.toString(2).padStart(16, '0'),
      sum1: f16.sum1,
      sum2: f16.sum2,
    },
    fletcher32: {
      hex: f32.checksum.toString(16).toUpperCase().padStart(8, '0'),
      decimal: f32.checksum,
      binary: f32.checksum.toString(2).padStart(32, '0'),
      sum1: f32.sum1,
      sum2: f32.sum2,
    },
    adler32: {
      hex: adler.toString(16).toUpperCase().padStart(8, '0'),
      decimal: adler,
      binary: adler.toString(2).padStart(32, '0'),
    },
  };
}

// ─── Input handling ───────────────────────────────────────────────────────────

export type InputMode = 'text' | 'hex';

export interface ParsedInput {
  bytes: number[];
  error: string | null;
}

/**
 * Hex mode accepts whatever people paste out of a hex dump: spaces, newlines,
 * commas, `0x` and `\x` prefixes. Anything left over that is not a hex digit is
 * an error rather than something to silently drop.
 */
export function parseHexBytes(input: string): ParsedInput {
  const cleaned = input.replace(/0x|\\x|[\s,:;_-]/gi, '');
  if (cleaned.length === 0) return { bytes: [], error: null };

  const bad = cleaned.match(/[^0-9a-f]/i);
  if (bad) {
    return { bytes: [], error: `"${bad[0]}" is not a hex digit.` };
  }
  if (cleaned.length % 2 !== 0) {
    return {
      bytes: [],
      error: `Odd number of hex digits (${cleaned.length}) — each byte needs two.`,
    };
  }

  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return { bytes, error: null };
}

export function parseInput(input: string, mode: InputMode): ParsedInput {
  return mode === 'hex' ? parseHexBytes(input) : { bytes: stringToBytes(input), error: null };
}

// ─── Step-by-step accumulator traces ──────────────────────────────────────────

export interface FletcherStep {
  /** Position of the byte (Fletcher-16) or 16-bit word (Fletcher-32). */
  index: number;
  /** The value folded in at this step. */
  value: number;
  sum1: number;
  sum2: number;
}

/**
 * The trace is a teaching aid, not the answer, so it is capped — a pasted
 * megabyte would otherwise allocate a step object per byte.
 */
export const TRACE_LIMIT = 1000;

export function fletcher16Steps(bytes: number[], limit = TRACE_LIMIT): FletcherStep[] {
  const steps: FletcherStep[] = [];
  let sum1 = 0;
  let sum2 = 0;
  const end = Math.min(bytes.length, limit);
  for (let i = 0; i < end; i++) {
    sum1 = (sum1 + bytes[i]) % 255;
    sum2 = (sum2 + sum1) % 255;
    steps.push({ index: i, value: bytes[i], sum1, sum2 });
  }
  return steps;
}

/** The 16-bit words Fletcher-32 consumes; a trailing odd byte is zero-padded. */
export function toWords(bytes: number[]): number[] {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    words.push((bytes[i] << 8) | (i + 1 < bytes.length ? bytes[i + 1] : 0));
  }
  return words;
}

export function fletcher32Steps(bytes: number[], limit = TRACE_LIMIT): FletcherStep[] {
  const steps: FletcherStep[] = [];
  let sum1 = 0;
  let sum2 = 0;
  const words = toWords(bytes);
  const end = Math.min(words.length, limit);
  for (let i = 0; i < end; i++) {
    sum1 = (sum1 + words[i]) % 65535;
    sum2 = (sum2 + sum1) % 65535;
    steps.push({ index: i, value: words[i], sum1, sum2 });
  }
  return steps;
}

// ─── Structured analysis for the UI ───────────────────────────────────────────

export interface FletcherAnalysis extends FletcherResult {
  bytes: number[];
  byteCount: number;
  wordCount: number;
  /** True when Fletcher-32 had to zero-pad an odd trailing byte. */
  padded: boolean;
  steps16: FletcherStep[];
  steps32: FletcherStep[];
  /** True when the traces stop short of the full message (see TRACE_LIMIT). */
  stepsTruncated: boolean;
}

export function analyzeFletcher(bytes: number[]): FletcherAnalysis {
  return {
    ...computeAllFromBytes(bytes),
    bytes,
    byteCount: bytes.length,
    wordCount: Math.ceil(bytes.length / 2),
    padded: bytes.length % 2 === 1,
    steps16: fletcher16Steps(bytes),
    steps32: fletcher32Steps(bytes),
    stepsTruncated: bytes.length > TRACE_LIMIT,
  };
}

/** Printable rendering of a byte for the trace table; non-printable → '·'. */
export function byteChar(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '·';
}

export function formatFletcherResult(result: FletcherResult): string {
  const lines = [
    '=== Fletcher-16 ===',
    'Hex:     0x' + result.fletcher16.hex,
    'Decimal: ' + result.fletcher16.decimal,
    'Binary:  ' + result.fletcher16.binary,
    '  Sum1:  ' + result.fletcher16.sum1 + ' (mod 255)',
    '  Sum2:  ' + result.fletcher16.sum2 + ' (mod 255)',
    '',
    '=== Fletcher-32 ===',
    'Hex:     0x' + result.fletcher32.hex,
    'Decimal: ' + result.fletcher32.decimal,
    'Binary:  ' + result.fletcher32.binary,
    '  Sum1:  ' + result.fletcher32.sum1 + ' (mod 65535)',
    '  Sum2:  ' + result.fletcher32.sum2 + ' (mod 65535)',
    '',
    '=== Adler-32 (for comparison) ===',
    'Hex:     0x' + result.adler32.hex,
    'Decimal: ' + result.adler32.decimal,
    'Binary:  ' + result.adler32.binary,
    '',
    'Note: Fletcher differs from Adler-32 in modulus and initial values.',
    'Fletcher-16 uses mod 255; Adler-32 uses mod 65521 with initial sum=1.',
  ];
  return lines.join('\n');
}
