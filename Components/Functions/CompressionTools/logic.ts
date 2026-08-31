// ─── DEFLATE compression (gzip / zlib / raw) ──────────────────────────────────
// Three container formats around the same DEFLATE stream:
//   gzip - RFC 1952, the `gzip`/`gunzip` CLI and Content-Encoding: gzip
//   zlib - RFC 1950, a 2-byte header + Adler-32 checksum
//   raw  - RFC 1951, the bare stream with no header or checksum
// Compressed bytes are not text, so they are carried as Base64 or hex.
// Everything is synchronous so the operations can run inside a Blocks pipeline.

import {
  gzipSync, gunzipSync,
  zlibSync, unzlibSync,
  deflateSync, inflateSync,
} from 'fflate';

export type CompressionFormat = 'gzip' | 'zlib' | 'raw';
export type BinaryEncoding = 'base64' | 'hex';

export const COMPRESSION_FORMATS: CompressionFormat[] = ['gzip', 'zlib', 'raw'];
export const BINARY_ENCODINGS: BinaryEncoding[] = ['base64', 'hex'];

// fflate accepts 0-9; 0 stores the data uncompressed.
export const COMPRESSION_LEVELS = ['1', '6', '9'] as const;

export const formatLabel: Record<CompressionFormat, string> = {
  gzip: 'Gzip',
  zlib: 'Zlib',
  raw: 'Raw DEFLATE',
};

// The name of the thing that fails, for error messages.
const formatNoun: Record<CompressionFormat, string> = {
  gzip: 'gzip',
  zlib: 'zlib',
  raw: 'raw DEFLATE',
};

// ─── byte <-> text helpers ────────────────────────────────────────────────────

const CHUNK = 0x8000; // fromCharCode blows the stack on large spreads

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  // Tolerate whitespace, URL-safe alphabets and missing padding.
  let cleaned = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (cleaned.length % 4 !== 0) {
    cleaned += '='.repeat(4 - (cleaned.length % 4));
  }
  let binary: string;
  try {
    binary = atob(cleaned);
  } catch {
    throw new Error('Input is not valid Base64');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBytes(value: string): Uint8Array {
  // Tolerate whitespace, 0x prefixes and \x escapes.
  const cleaned = value.replace(/0x/gi, '').replace(/\\x/gi, '').replace(/[\s,:-]+/g, '');
  if (!cleaned) return new Uint8Array(0);
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('Input is not valid hex');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex input has an odd number of digits');
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function encodeBytes(bytes: Uint8Array, encoding: BinaryEncoding): string {
  return encoding === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
}

export function decodeBytes(value: string, encoding: BinaryEncoding): Uint8Array {
  return encoding === 'hex' ? hexToBytes(value) : base64ToBytes(value);
}

// ─── compress / decompress ────────────────────────────────────────────────────

type DeflateLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function clampLevel(level: number | string | undefined): DeflateLevel {
  const n = typeof level === 'string' ? parseInt(level, 10) : level;
  if (n === undefined || Number.isNaN(n)) return 6;
  return Math.min(9, Math.max(0, Math.round(n))) as DeflateLevel;
}

export function compressBytes(
  bytes: Uint8Array,
  format: CompressionFormat,
  level: number | string = 6,
): Uint8Array {
  // mtime: 0 keeps gzip output deterministic; the header timestamp would
  // otherwise change on every run and break comparisons.
  const opts = { level: clampLevel(level) };
  if (format === 'gzip') return gzipSync(bytes, { ...opts, mtime: 0 });
  if (format === 'zlib') return zlibSync(bytes, opts);
  return deflateSync(bytes, opts);
}

export function decompressBytes(bytes: Uint8Array, format: CompressionFormat): Uint8Array {
  try {
    if (format === 'gzip') return gunzipSync(bytes);
    if (format === 'zlib') return unzlibSync(bytes);
    return inflateSync(bytes);
  } catch {
    throw new Error(`Input is not valid ${formatNoun[format]} data`);
  }
}

/** Compress text and return the bytes as Base64 or hex. */
export function compressText(
  text: string,
  format: CompressionFormat,
  encoding: BinaryEncoding = 'base64',
  level: number | string = 6,
): string {
  if (!text) return '';
  const bytes = compressBytes(new TextEncoder().encode(text), format, level);
  return encodeBytes(bytes, encoding);
}

/** Decode Base64/hex, decompress it, and read the result back as UTF-8 text. */
export function decompressText(
  payload: string,
  format: CompressionFormat,
  encoding: BinaryEncoding = 'base64',
): string {
  if (!payload.trim()) return '';
  const bytes = decompressBytes(decodeBytes(payload, encoding), format);
  return new TextDecoder().decode(bytes);
}

// ─── reporting ────────────────────────────────────────────────────────────────

export type CompressionStats = {
  inputBytes: number;
  outputBytes: number;
  /** Compressed size as a fraction of the original. 0.3 = 30% of the original. */
  ratio: number;
  /** Percentage saved, negative when the container costs more than it saves. */
  savedPercent: number;
};

export function compressionStats(text: string, compressed: Uint8Array): CompressionStats {
  const inputBytes = new TextEncoder().encode(text).length;
  const outputBytes = compressed.length;
  const ratio = inputBytes === 0 ? 0 : outputBytes / inputBytes;
  return {
    inputBytes,
    outputBytes,
    ratio,
    savedPercent: inputBytes === 0 ? 0 : (1 - ratio) * 100,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function describeCompression(stats: CompressionStats): string {
  const { inputBytes, outputBytes, savedPercent } = stats;
  const direction = savedPercent >= 0 ? 'smaller' : 'larger';
  return `${formatBytes(inputBytes)} → ${formatBytes(outputBytes)} (${Math.abs(savedPercent).toFixed(1)}% ${direction})`;
}
