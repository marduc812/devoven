// ─── MurmurHash3 (32-bit) ────────────────────────────────────────────────────
// Pure TypeScript implementation using Math.imul() and >>> (unsigned right shift).
// No BigInt, no external libs.

const C1 = 0xcc9e2d51;
const C2 = 0x1b873593;
const BLOCK_MULT = 5;
const BLOCK_ADD = 0xe6546b64;
const FMIX_C1 = 0x85ebca6b;
const FMIX_C2 = 0xc2b2ae35;

/** The magic numbers, named, so the trace can be read without a reference open. */
export const MURMUR_CONSTANTS: { name: string; value: string; role: string }[] = [
  { name: 'c1', value: '0xCC9E2D51', role: 'first k1 multiply' },
  { name: 'rotl 15', value: '15', role: 'k1 rotate, between the multiplies' },
  { name: 'c2', value: '0x1B873593', role: 'second k1 multiply' },
  { name: 'rotl 13', value: '13', role: 'h1 rotate, after each block' },
  { name: 'm, n', value: '5, 0xE6546B64', role: 'h1 = h1 × m + n, per block' },
  { name: 'fmix c1', value: '0x85EBCA6B', role: 'first finalization multiply' },
  { name: 'fmix c2', value: '0xC2B2AE35', role: 'second finalization multiply' },
];

/**
 * A hash is defined over bytes, so text has to be encoded first. UTF-8 is what
 * every other implementation would see on the wire; the previous
 * `charCodeAt(i) & 0xff` silently truncated anything outside Latin-1 (U+20AC
 * became 0xAC) and produced hashes that matched nothing.
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

const rotl32 = (x: number, r: number): number => ((x << r) | (x >>> (32 - r))) >>> 0;

/** k1 ×= c1, rotl 15, ×= c2 — the same three steps for both blocks and the tail. */
function mixK1(k1: number): number {
  let k = Math.imul(k1, C1) >>> 0;
  k = rotl32(k, 15);
  return Math.imul(k, C2) >>> 0;
}

/** The little-endian 32-bit word starting at `offset`. */
function readBlock(bytes: number[], offset: number): number {
  return (
    ((bytes[offset] & 0xff) |
      ((bytes[offset + 1] & 0xff) << 8) |
      ((bytes[offset + 2] & 0xff) << 16) |
      ((bytes[offset + 3] & 0xff) << 24)) >>>
    0
  );
}

/** The 1–3 leftover bytes, packed into the low end of a word. */
function readTail(tail: number[]): number {
  let k1 = 0;
  if (tail.length >= 3) k1 ^= (tail[2] & 0xff) << 16;
  if (tail.length >= 2) k1 ^= (tail[1] & 0xff) << 8;
  return (k1 ^ (tail[0] & 0xff)) >>> 0;
}

/** Avalanche finalizer: three xor-shifts around two multiplies. */
export function fmix32(h: number): number {
  let x = h >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, FMIX_C1) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, FMIX_C2) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

export function murmurHash3_32Bytes(bytes: number[], seed: number = 0): number {
  const len = bytes.length;
  let h1 = seed >>> 0;

  // Process 4-byte blocks
  const nblocks = Math.floor(len / 4);
  for (let i = 0; i < nblocks; i++) {
    h1 = (h1 ^ mixK1(readBlock(bytes, i * 4))) >>> 0;
    h1 = rotl32(h1, 13);
    h1 = (Math.imul(h1, BLOCK_MULT) + BLOCK_ADD) >>> 0;
  }

  // Handle remaining bytes (tail) — no h1 rotation here, unlike a block
  const tail = bytes.slice(nblocks * 4);
  if (tail.length > 0) {
    h1 = (h1 ^ mixK1(readTail(tail))) >>> 0;
  }

  return fmix32((h1 ^ len) >>> 0);
}

export function murmurHash3_32(input: string, seed: number = 0): number {
  return murmurHash3_32Bytes(stringToBytes(input), seed);
}

// ─── Input handling ───────────────────────────────────────────────────────────

export type InputMode = 'text' | 'hex';

export interface ParsedInput {
  bytes: number[];
  error: string | null;
}

/**
 * Hex mode accepts whatever people paste out of a hex dump: spaces, newlines,
 * commas, `0x` and `\x` prefixes. Anything left that is not a hex digit is
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

// ─── Step-by-step mixing trace ────────────────────────────────────────────────

export type MurmurStage = 'seed' | 'block' | 'tail' | 'final';

export interface MurmurStep {
  stage: MurmurStage;
  /** Row label — `seed`, `block 0`, `tail (2 bytes)`, `^= len (13)`, … */
  label: string;
  /** Block index; null for the seed row and every finalization row. */
  index: number | null;
  /** The source bytes consumed here; empty for seed and finalization. */
  bytes: number[];
  /** The little-endian word before mixing; null when no k1 is involved. */
  k1Raw: number | null;
  /** k1 after ×c1, rotl 15, ×c2 — the value actually XORed into h1. */
  k1Mixed: number | null;
  /** h1 after this step. */
  h1: number;
}

/**
 * The trace is a teaching aid, not the answer, so the per-block rows are capped
 * — a pasted megabyte would otherwise allocate a step object per 4 bytes. The
 * loop still runs to completion, so the tail and finalization rows (and the
 * final h1) are the real ones; only middle rows are missing.
 */
export const TRACE_LIMIT = 1000;

export function murmurSteps(
  bytes: number[],
  seed: number = 0,
  limit: number = TRACE_LIMIT
): MurmurStep[] {
  const len = bytes.length;
  let h1 = seed >>> 0;

  const steps: MurmurStep[] = [
    { stage: 'seed', label: 'seed', index: null, bytes: [], k1Raw: null, k1Mixed: null, h1 },
  ];

  const nblocks = Math.floor(len / 4);
  for (let i = 0; i < nblocks; i++) {
    const offset = i * 4;
    const k1Raw = readBlock(bytes, offset);
    const k1Mixed = mixK1(k1Raw);
    h1 = (h1 ^ k1Mixed) >>> 0;
    h1 = rotl32(h1, 13);
    h1 = (Math.imul(h1, BLOCK_MULT) + BLOCK_ADD) >>> 0;

    if (i < limit) {
      steps.push({
        stage: 'block',
        label: `block ${i}`,
        index: i,
        bytes: bytes.slice(offset, offset + 4),
        k1Raw,
        k1Mixed,
        h1,
      });
    }
  }

  const tail = bytes.slice(nblocks * 4);
  if (tail.length > 0) {
    const k1Raw = readTail(tail);
    const k1Mixed = mixK1(k1Raw);
    h1 = (h1 ^ k1Mixed) >>> 0;
    steps.push({
      stage: 'tail',
      label: `tail (${tail.length} byte${tail.length === 1 ? '' : 's'})`,
      index: nblocks,
      bytes: tail,
      k1Raw,
      k1Mixed,
      h1,
    });
  }

  const final = (label: string, value: number) =>
    steps.push({
      stage: 'final' as const,
      label,
      index: null,
      bytes: [],
      k1Raw: null,
      k1Mixed: null,
      h1: value,
    });

  h1 = (h1 ^ len) >>> 0;
  final(`^= len (${len})`, h1);
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  final('^= h1 >>> 16', h1);
  h1 = Math.imul(h1, FMIX_C1) >>> 0;
  final('*= 0x85EBCA6B', h1);
  h1 = (h1 ^ (h1 >>> 13)) >>> 0;
  final('^= h1 >>> 13', h1);
  h1 = Math.imul(h1, FMIX_C2) >>> 0;
  final('*= 0xC2B2AE35', h1);
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  final('^= h1 >>> 16', h1);

  return steps;
}

export function byteChar(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '·';
}

/**
 * Seeds are quoted both ways in the wild — SMHasher's test seed is written
 * `0x9747b28c`, application code tends to write a decimal — so accept either.
 */
export function parseSeed(input: string): { seed: number; error: string | null } {
  const text = input.trim();
  if (text === '') return { seed: 0, error: null };

  const hex = /^0x[0-9a-f]+$/i.test(text);
  if (!hex && !/^\d+$/.test(text)) {
    return { seed: 0, error: `"${text}" is not a decimal or 0x-prefixed hex number.` };
  }

  const value = hex ? parseInt(text.slice(2), 16) : parseInt(text, 10);
  if (value > 0xffffffff) {
    return { seed: 0, error: 'Seed must fit in 32 bits (max 4294967295 / 0xFFFFFFFF).' };
  }
  return { seed: value >>> 0, error: null };
}

// ─── Structured result ────────────────────────────────────────────────────────

export interface MurmurAnalysis {
  seed: number;
  hash: number;
  hex: string;
  decimal: string;
  /** The same 32 bits read as a signed integer — what Java's murmur3_32 returns. */
  signed: number;
  binary: string;
  byteCount: number;
  blockCount: number;
  /** 0–3 bytes left over after the last whole block. */
  tailLength: number;
  steps: MurmurStep[];
  /** Block rows the trace left out because of `limit`. */
  omittedBlocks: number;
}

export function analyzeMurmur(
  bytes: number[],
  seed: number = 0,
  limit: number = TRACE_LIMIT
): MurmurAnalysis {
  const hash = murmurHash3_32Bytes(bytes, seed);
  const blockCount = Math.floor(bytes.length / 4);

  return {
    seed: seed >>> 0,
    hash,
    hex: hash.toString(16).toUpperCase().padStart(8, '0'),
    decimal: hash.toString(10),
    signed: hash | 0,
    binary: hash.toString(2).padStart(32, '0'),
    byteCount: bytes.length,
    blockCount,
    tailLength: bytes.length % 4,
    steps: murmurSteps(bytes, seed, limit),
    omittedBlocks: Math.max(0, blockCount - limit),
  };
}

// ─── Legacy string output ─────────────────────────────────────────────────────
// No longer rendered — the tool draws a real UI. Kept exported and tested.

export interface MurmurHashResult {
  seed: number;
  hex: string;
  decimal: string;
  binary: string;
}

export function computeMurmurHash(input: string, seed: number = 0): MurmurHashResult {
  const hash = murmurHash3_32(input, seed);
  return {
    seed,
    hex: hash.toString(16).toUpperCase().padStart(8, '0'),
    decimal: hash.toString(10),
    binary: hash.toString(2).padStart(32, '0'),
  };
}

export function formatMurmurResult(result: MurmurHashResult): string {
  const lines = [
    '=== MurmurHash3 (32-bit) ===',
    'Seed:    ' + result.seed,
    'Hex:     0x' + result.hex,
    'Decimal: ' + result.decimal,
    'Binary:  ' + result.binary,
    '',
    'Algorithm: MurmurHash3 (32-bit variant)',
    'Use cases: Hash tables, bloom filters, fast non-cryptographic hashing.',
    'Note: MurmurHash is NOT suitable for cryptographic or security purposes.',
  ];
  return lines.join('\n');
}
