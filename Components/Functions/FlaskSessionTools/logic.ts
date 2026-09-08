// ─── Flask session cookies ───────────────────────────────────────────────────
// A Flask session cookie is an itsdangerous URLSafeTimedSerializer token:
// `payload.timestamp.signature`, all three base64url without padding. The
// payload is JSON, zlib-compressed when the token starts with a dot. The
// signature is HMAC-SHA1 over `payload.timestamp`, keyed by
// HMAC-SHA1(secret_key, "cookie-session") - itsdangerous's default derivation.

import CryptoJS from 'crypto-js';
import { unzlibSync, zlibSync } from 'fflate';

export const DEFAULT_SALT = 'cookie-session';

// ─── base64url ────────────────────────────────────────────────────────────────

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) throw new Error('Not valid base64url');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── crypto-js interop ────────────────────────────────────────────────────────

function bytesToWords(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] = (words[i >>> 2] ?? 0) | (bytes[i] << (24 - (i % 4) * 8));
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

function wordsToBytes(words: CryptoJS.lib.WordArray): Uint8Array {
  const out = new Uint8Array(words.sigBytes);
  for (let i = 0; i < words.sigBytes; i++) {
    out[i] = (words.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return out;
}

/** itsdangerous's `key_derivation="hmac"`: HMAC-SHA1 of the salt under the key. */
function deriveKey(secret: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.HmacSHA1(salt, secret);
}

function sign(value: string, secret: string, salt: string): string {
  const mac = CryptoJS.HmacSHA1(value, deriveKey(secret, salt));
  return bytesToBase64Url(wordsToBytes(mac));
}

/** Length-independent comparison; the values here are public, but habits matter. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── Timestamps ───────────────────────────────────────────────────────────────

/**
 * itsdangerous 2.x writes the timestamp as big-endian bytes of Unix seconds.
 * Version 1 wrote seconds since 2011-01-01, so a token from an old app decodes
 * to a date 41 years off; both readings are reported.
 */
const ITSDANGEROUS_V1_EPOCH = 1293840000;

export type TokenTimestamp = {
  raw: string;
  seconds: number;
  date: Date;
  legacyDate: Date;
};

function readTimestamp(part: string): TokenTimestamp | null {
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(part);
  } catch {
    return null;
  }
  if (bytes.length === 0 || bytes.length > 8) return null;
  let seconds = 0;
  for (const byte of bytes) seconds = seconds * 256 + byte;
  return {
    raw: part,
    seconds,
    date: new Date(seconds * 1000),
    legacyDate: new Date((seconds + ITSDANGEROUS_V1_EPOCH) * 1000),
  };
}

function writeTimestamp(seconds: number): string {
  const bytes: number[] = [];
  let value = Math.floor(seconds);
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value = Math.floor(value / 256);
  }
  if (bytes.length === 0) bytes.push(0);
  return bytesToBase64Url(new Uint8Array(bytes));
}

// ─── Decode ───────────────────────────────────────────────────────────────────

export type FlaskSession = {
  /** The JSON payload, pretty-printed. */
  payload: string;
  compressed: boolean;
  timestamp: TokenTimestamp | null;
  signature: string;
  /** The `payload.timestamp` half the signature covers. */
  signedValue: string;
};

export function decodeFlaskSession(cookie: string): FlaskSession {
  const token = cookie.trim().replace(/^session=/, '').replace(/;.*$/, '');
  if (!token) throw new Error('Paste a Flask session cookie');

  const compressed = token.startsWith('.');
  const body = compressed ? token.slice(1) : token;
  const parts = body.split('.');
  if (parts.length !== 3) {
    throw new Error('A Flask session cookie has three dot-separated parts');
  }

  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(parts[0]);
  } catch {
    throw new Error('The payload is not valid base64url');
  }

  if (compressed) {
    try {
      bytes = unzlibSync(bytes);
    } catch {
      throw new Error('The payload is marked compressed but is not valid zlib data');
    }
  }

  const text = new TextDecoder().decode(bytes);
  let payload: string;
  try {
    payload = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // Not JSON is worth showing rather than refusing: a custom serializer, or a
    // token from something else that shares the itsdangerous shape.
    payload = text;
  }

  return {
    payload,
    compressed,
    timestamp: readTimestamp(parts[1]),
    signature: parts[2],
    signedValue: `${compressed ? '.' : ''}${parts[0]}.${parts[1]}`,
  };
}

export function formatFlaskSession(session: FlaskSession): string {
  const lines = [session.payload, ''];
  lines.push(`Compressed: ${session.compressed ? 'yes (zlib)' : 'no'}`);
  if (session.timestamp) {
    lines.push(`Signed at:  ${session.timestamp.date.toISOString()} (${session.timestamp.seconds})`);
    lines.push(`If itsdangerous 1.x: ${session.timestamp.legacyDate.toISOString()}`);
  } else {
    lines.push('Signed at:  unreadable timestamp');
  }
  lines.push(`Signature:  ${session.signature}`);
  return lines.join('\n');
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export type VerifyResult = {
  valid: boolean;
  expected: string;
  found: string;
};

export function verifyFlaskSession(cookie: string, secret: string, salt = DEFAULT_SALT): VerifyResult {
  if (!secret) throw new Error('Enter the secret key to verify against');
  const session = decodeFlaskSession(cookie);
  const expected = sign(session.signedValue, secret, salt);
  return {
    valid: constantTimeEqual(expected, session.signature),
    expected,
    found: session.signature,
  };
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export type SignOptions = {
  salt?: string;
  /** Unix seconds; the current time when left out. */
  timestamp?: number;
  /** Compress the payload and prefix the token with a dot, as Flask does. */
  compress?: boolean;
};

/** Builds a cookie from a JSON payload and a secret key. */
export function signFlaskSession(json: string, secret: string, options: SignOptions = {}): string {
  if (!secret) throw new Error('Enter a secret key to sign with');
  const text = json.trim();
  if (!text) throw new Error('Paste the JSON payload to sign');

  let compact: string;
  try {
    // Flask's JSON serializer writes compact separators and sorted keys.
    compact = JSON.stringify(sortKeys(JSON.parse(text)));
  } catch (e: unknown) {
    throw new Error(`The payload is not valid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
  }

  const raw = new TextEncoder().encode(compact);
  let bytes = raw;
  let compressed = false;
  if (options.compress ?? false) {
    const deflated = zlibSync(raw, { level: 6 });
    // Flask only keeps the compressed form when it is actually smaller.
    if (deflated.length < raw.length) {
      bytes = deflated;
      compressed = true;
    }
  }

  const payload = bytesToBase64Url(bytes);
  const stamp = writeTimestamp(options.timestamp ?? Math.floor(Date.now() / 1000));
  const value = `${compressed ? '.' : ''}${payload}.${stamp}`;
  return `${value}.${sign(value, secret, options.salt ?? DEFAULT_SALT)}`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** The pipeline form: cookie in, payload JSON out. */
export function flaskSessionPayload(cookie: string): string {
  return decodeFlaskSession(cookie).payload;
}
