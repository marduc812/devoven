// ─── BLAKE2b / BLAKE2s / BLAKE3 ──────────────────────────────────────────────
// Backed by @noble/hashes, which ships all three as pure synchronous JS. The
// wrappers here exist to turn user-typed strings into the byte-level options
// noble expects, and to fail with a message the UI can show instead of letting
// a RangeError from deep inside the library surface.

import { blake2b, blake2s } from '@noble/hashes/blake2.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export type BlakeOutput = 'hex' | 'base64';

/** Digest sizes offered in the UI, in bits. */
export const BLAKE2B_SIZES = [128, 160, 224, 256, 384, 512] as const;
export const BLAKE2S_SIZES = [128, 160, 224, 256] as const;
export const BLAKE3_SIZES = [128, 256, 512] as const;

const MAX_KEY_BYTES = { blake2b: 64, blake2s: 32 };

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

export function encodeDigest(bytes: Uint8Array, output: BlakeOutput): string {
  return output === 'base64' ? toBase64(bytes) : bytesToHex(bytes);
}

/**
 * Digest length in bytes from a size in bits, rejecting anything the algorithm
 * cannot produce. BLAKE2 caps at its block half-width; BLAKE3 is an XOF and has
 * no real ceiling, so it only gets a sanity limit.
 */
function digestBytes(bits: number, maxBytes: number, algorithm: string): number {
  if (!Number.isInteger(bits) || bits <= 0) {
    throw new Error('Digest size must be a positive number of bits');
  }
  if (bits % 8 !== 0) throw new Error('Digest size must be a whole number of bytes');
  const bytes = bits / 8;
  if (bytes > maxBytes) {
    throw new Error(`${algorithm} digests are at most ${maxBytes * 8} bits`);
  }
  return bytes;
}

function keyBytes(key: string, max: number, algorithm: string): Uint8Array | undefined {
  if (!key) return undefined;
  const bytes = utf8ToBytes(key);
  if (bytes.length > max) {
    throw new Error(`${algorithm} keys are at most ${max} bytes (got ${bytes.length})`);
  }
  return bytes;
}

export interface Blake2Options {
  /** Digest size in bits. */
  bits?: number;
  /** Optional key, turning the hash into a MAC. UTF-8 encoded. */
  key?: string;
  output?: BlakeOutput;
}

export function blake2bHash(input: string, options: Blake2Options = {}): string {
  const dkLen = digestBytes(options.bits ?? 512, 64, 'BLAKE2b');
  const key = keyBytes(options.key ?? '', MAX_KEY_BYTES.blake2b, 'BLAKE2b');
  return encodeDigest(blake2b(utf8ToBytes(input), { dkLen, key }), options.output ?? 'hex');
}

export function blake2sHash(input: string, options: Blake2Options = {}): string {
  const dkLen = digestBytes(options.bits ?? 256, 32, 'BLAKE2s');
  const key = keyBytes(options.key ?? '', MAX_KEY_BYTES.blake2s, 'BLAKE2s');
  return encodeDigest(blake2s(utf8ToBytes(input), { dkLen, key }), options.output ?? 'hex');
}

export interface Blake3Options {
  bits?: number;
  output?: BlakeOutput;
  /**
   * Keyed mode. BLAKE3 requires exactly 32 key bytes, so the UI hands us a
   * passphrase and we say plainly when it is the wrong length rather than
   * silently padding it.
   */
  key?: string;
  /** Key-derivation mode context string. Mutually exclusive with `key`. */
  context?: string;
}

export function blake3Hash(input: string, options: Blake3Options = {}): string {
  // 2048 bits is well past any practical use and keeps a typo like 99999999
  // from allocating a huge buffer in the browser.
  const dkLen = digestBytes(options.bits ?? 256, 256, 'BLAKE3');
  const message = utf8ToBytes(input);
  const key = options.key ?? '';
  const context = options.context ?? '';

  if (key && context) {
    throw new Error('BLAKE3 takes either a key or a derivation context, not both');
  }

  if (key) {
    const bytes = utf8ToBytes(key);
    if (bytes.length !== 32) {
      throw new Error(`BLAKE3 keys must be exactly 32 bytes (got ${bytes.length})`);
    }
    return encodeDigest(blake3(message, { dkLen, key: bytes }), options.output ?? 'hex');
  }

  if (context) {
    return encodeDigest(blake3(message, { dkLen, context: utf8ToBytes(context) }), options.output ?? 'hex');
  }

  return encodeDigest(blake3(message, { dkLen }), options.output ?? 'hex');
}
