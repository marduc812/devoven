// ─── Key derivation functions ────────────────────────────────────────────────
// PBKDF2, HKDF, scrypt and Argon2, all from @noble/hashes, all synchronous and
// pure JS — no wasm, so they work in the Blocks pipeline as well as on their
// own pages.
//
// The point of every wrapper here is the validation. A KDF is deliberately slow,
// so a fat-fingered cost parameter is the difference between a 50 ms answer and
// a locked-up tab. Each function rejects out-of-range costs with a message that
// names the limit before it starts work.

import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { argon2d, argon2i, argon2id } from '@noble/hashes/argon2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type { CHash } from '@noble/hashes/utils.js';

export type KdfHash = 'sha1' | 'sha256' | 'sha384' | 'sha512';
export type KdfOutput = 'hex' | 'base64';
/** How a salt / info / key field typed by a human should be read. */
export type ByteFormat = 'utf8' | 'hex' | 'base64';

const HASHES: Record<KdfHash, CHash> = { sha1, sha256, sha384, sha512 };
export const HASH_LABELS: Record<KdfHash, string> = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

// Ceilings chosen so the worst case is a few seconds of a blocked main thread,
// not a hung tab. They are far above any realistic production parameter.
export const MAX_PBKDF2_ITERATIONS = 10_000_000;
export const MAX_DERIVED_BYTES = 1024;
export const MAX_DERIVED_BITS = MAX_DERIVED_BYTES * 8;
export const MAX_SCRYPT_MEMORY = 512 * 1024 * 1024;
export const MAX_ARGON2_MEMORY_KIB = 1024 * 1024;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Uint8Array {
  const binary = typeof atob === 'function' ? atob(value) : Buffer.from(value, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeKey(bytes: Uint8Array, output: KdfOutput): string {
  return output === 'base64' ? toBase64(bytes) : bytesToHex(bytes);
}

/** Hex with whitespace stripped, or null when the field is not hex at all. */
function cleanHex(value: string): string | null {
  const cleaned = value.replace(/\s+/g, '');
  return /^[0-9a-f]*$/i.test(cleaned) ? cleaned : null;
}

/**
 * Read a salt / info / secret field in whichever format the user picked.
 *
 * Odd-length hex is padded rather than rejected, and padded the way CyberChef
 * does it: digits pair off from the left and the leftover trailing digit
 * becomes the low nibble of a final byte, so `123` reads as `12 03` and not as
 * `01 23`. That choice is invisible in the output, so anything calling this on
 * user input should also show `byteInputNote` beside the field.
 */
export function decodeBytes(value: string, format: ByteFormat, label: string): Uint8Array {
  if (format === 'utf8') return utf8ToBytes(value);

  if (format === 'hex') {
    const cleaned = cleanHex(value);
    if (cleaned === null) throw new Error(`${label} is not valid hex`);

    const padded = cleaned.length % 2 === 0 ? cleaned : `${cleaned.slice(0, -1)}0${cleaned.slice(-1)}`;
    const bytes = new Uint8Array(padded.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  try {
    return fromBase64(value.trim());
  } catch {
    throw new Error(`${label} is not valid base64`);
  }
}

/**
 * What to tell the user about how a field was read, or null when it was taken
 * literally. Only odd-length hex needs saying: the padding changes the bytes
 * and nothing else on screen would reveal it.
 */
export function byteInputNote(value: string, format: ByteFormat): string | null {
  if (format !== 'hex') return null;
  const cleaned = cleanHex(value);
  if (cleaned === null || cleaned.length % 2 === 0 || cleaned.length === 0) return null;

  const bytes = decodeBytes(value, 'hex', 'value');
  const rendered = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
  return `Odd number of hex digits — padded and read as ${rendered}.`;
}

/**
 * Key sizes are entered in bits, the unit CyberChef, hashcat and the RFCs all
 * use. Everything below this line works in bytes, which is what the KDF APIs
 * take.
 */
export function bitsToBytes(bits: number, label = 'Key size'): number {
  if (!Number.isInteger(bits) || bits < 1) {
    throw new Error(`${label} must be a whole number of bits, at least 8`);
  }
  if (bits % 8 !== 0) {
    throw new Error(`${label} must be a whole number of bytes — use a multiple of 8 bits`);
  }
  if (bits > MAX_DERIVED_BITS) {
    throw new Error(`${label} is capped at ${MAX_DERIVED_BITS} bits (${MAX_DERIVED_BYTES} bytes)`);
  }
  return bits / 8;
}

/**
 * Backstop for callers that pass bytes directly. The UI and the Blocks registry
 * both go through `bitsToBytes`, which reports the same limits in bits.
 */
function checkDkLen(dkLen: number): number {
  if (!Number.isInteger(dkLen) || dkLen < 1) {
    throw new Error('Key length must be a whole number of bytes, at least 1');
  }
  if (dkLen > MAX_DERIVED_BYTES) {
    throw new Error(`Key length is capped at ${MAX_DERIVED_BITS} bits (${MAX_DERIVED_BYTES} bytes)`);
  }
  return dkLen;
}

function resolveHash(hash: KdfHash): CHash {
  const fn = HASHES[hash];
  if (!fn) throw new Error(`Unknown hash "${hash}"`);
  return fn;
}

// ─── PBKDF2 (RFC 8018) ───────────────────────────────────────────────────────

export interface Pbkdf2Options {
  salt: Uint8Array;
  iterations: number;
  hash?: KdfHash;
  dkLen?: number;
}

export function derivePbkdf2(password: string, options: Pbkdf2Options): Uint8Array {
  const { iterations } = options;
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error('Iterations must be a whole number, at least 1');
  }
  if (iterations > MAX_PBKDF2_ITERATIONS) {
    throw new Error(
      `Iterations are capped at ${MAX_PBKDF2_ITERATIONS.toLocaleString()} so the page stays responsive`,
    );
  }
  return pbkdf2(resolveHash(options.hash ?? 'sha256'), password, options.salt, {
    c: iterations,
    dkLen: checkDkLen(options.dkLen ?? 32),
  });
}

// ─── HKDF (RFC 5869) ─────────────────────────────────────────────────────────

export interface HkdfOptions {
  salt?: Uint8Array;
  info?: Uint8Array;
  hash?: KdfHash;
  dkLen?: number;
}

export function deriveHkdf(ikm: string, options: HkdfOptions = {}): Uint8Array {
  // RFC 5869 §2.3 also caps the output at 255 hash lengths, but that is 5100
  // bytes for the weakest hash offered here — checkDkLen's 1024 always bites
  // first, so there is nothing extra to enforce.
  const dkLen = checkDkLen(options.dkLen ?? 32);
  return hkdf(resolveHash(options.hash ?? 'sha256'), utf8ToBytes(ikm), options.salt, options.info, dkLen);
}

// ─── scrypt (RFC 7914) ───────────────────────────────────────────────────────

export interface ScryptOptions {
  salt: Uint8Array;
  N: number;
  r: number;
  p: number;
  dkLen?: number;
}

export function deriveScrypt(password: string, options: ScryptOptions): Uint8Array {
  const { N, r, p } = options;

  if (!Number.isInteger(N) || N < 2 || (N & (N - 1)) !== 0) {
    throw new Error('N must be a power of two, at least 2');
  }
  if (!Number.isInteger(r) || r < 1) throw new Error('r must be a whole number, at least 1');
  if (!Number.isInteger(p) || p < 1) throw new Error('p must be a whole number, at least 1');

  // scrypt's whole design is to cost memory; say how much before spending it.
  const memory = 128 * N * r * p;
  if (memory > MAX_SCRYPT_MEMORY) {
    const asked = Math.round(memory / (1024 * 1024));
    const cap = MAX_SCRYPT_MEMORY / (1024 * 1024);
    throw new Error(`These parameters need about ${asked} MB of memory; the limit here is ${cap} MB`);
  }

  return scrypt(password, options.salt, {
    N,
    r,
    p,
    dkLen: checkDkLen(options.dkLen ?? 32),
    maxmem: MAX_SCRYPT_MEMORY,
  });
}

// ─── Argon2 (RFC 9106) ───────────────────────────────────────────────────────

export type Argon2Variant = 'argon2id' | 'argon2i' | 'argon2d';

const ARGON2: Record<Argon2Variant, typeof argon2id> = {
  argon2id,
  argon2i,
  argon2d,
};

export interface Argon2Options {
  salt: Uint8Array;
  /** Time cost, in passes. */
  t: number;
  /** Memory cost, in KiB. */
  m: number;
  /** Lanes. */
  p: number;
  variant?: Argon2Variant;
  dkLen?: number;
  /** RFC 9106's optional secret value K — a server-side pepper. */
  secret?: Uint8Array;
  /** RFC 9106's optional associated data X. */
  ad?: Uint8Array;
}

export function deriveArgon2(
  password: string | Uint8Array,
  options: Argon2Options,
): Uint8Array {
  const { t, m, p } = options;
  const variant = options.variant ?? 'argon2id';
  const fn = ARGON2[variant];
  if (!fn) throw new Error(`Unknown Argon2 variant "${variant}"`);

  if (options.salt.length < 8) {
    throw new Error('Argon2 requires a salt of at least 8 bytes (RFC 9106)');
  }
  if (!Number.isInteger(t) || t < 1) throw new Error('Time cost must be a whole number, at least 1');
  if (!Number.isInteger(p) || p < 1) throw new Error('Parallelism must be a whole number, at least 1');
  if (!Number.isInteger(m) || m < 8 * p) {
    throw new Error(`Memory cost must be at least 8 KiB per lane (${8 * p} KiB for p=${p})`);
  }
  if (m > MAX_ARGON2_MEMORY_KIB) {
    throw new Error(`Memory cost is capped at ${MAX_ARGON2_MEMORY_KIB} KiB (1 GiB)`);
  }

  const dkLen = checkDkLen(options.dkLen ?? 32);
  // Users type bits, so name both units rather than only the one the RFC uses.
  if (dkLen < 4) throw new Error('Argon2 output must be at least 32 bits / 4 bytes (RFC 9106 §3.1)');

  return fn(password, options.salt, {
    t,
    m,
    p,
    dkLen,
    key: options.secret,
    personalization: options.ad,
    maxmem: MAX_ARGON2_MEMORY_KIB * 1024,
  });
}

/**
 * The PHC string an Argon2 verifier expects — what actually goes in a database
 * column, as opposed to the bare hash.
 */
export function argon2PhcString(
  digest: Uint8Array,
  options: Pick<Argon2Options, 'salt' | 't' | 'm' | 'p'> & { variant?: Argon2Variant },
): string {
  // PHC uses unpadded base64.
  const b64 = (bytes: Uint8Array) => toBase64(bytes).replace(/=+$/, '');
  const variant = options.variant ?? 'argon2id';
  return `$${variant}$v=19$m=${options.m},t=${options.t},p=${options.p}$${b64(options.salt)}$${b64(digest)}`;
}
