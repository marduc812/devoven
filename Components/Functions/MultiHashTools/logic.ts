import CryptoJS from 'crypto-js';

// Adler-32 implementation (pure math, no browser APIs)
export function adler32(str: string): number {
  const MOD_ADLER = 65521;
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i) & 0xff;
    s1 = (s1 + byte) % MOD_ADLER;
    s2 = (s2 + s1) % MOD_ADLER;
  }
  return ((s2 << 16) | s1) >>> 0;
}

// CRC32 implementation
const CRC_TABLE = (() => {
  const table = new Array<number>(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(str: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < str.length; i++) {
    crc = CRC_TABLE[(crc ^ str.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0);
}

// Simple xxHash-like approximation (FNV-1a variant, 32-bit)
export function xxHash32(str: string): number {
  const PRIME1 = 0x9e3779b1;
  const PRIME2 = 0x85ebca77;
  const PRIME3 = 0xc2b2ae3d;
  const PRIME5 = 0x165667b1;
  const seed = 0;
  let h = (seed + PRIME5) >>> 0;
  for (let i = 0; i < str.length; i++) {
    const b = str.charCodeAt(i) & 0xff;
    h = (Math.imul(((h + Math.imul(b, PRIME3)) >>> 0), PRIME1)) >>> 0;
    h = ((h << 11) | (h >>> 21)) >>> 0;
    h = Math.imul(h, PRIME2) >>> 0;
  }
  h = h ^ (h >>> 15);
  h = Math.imul(h, PRIME1) >>> 0;
  h = h ^ (h >>> 13);
  h = Math.imul(h, PRIME2) >>> 0;
  h = h ^ (h >>> 16);
  return h >>> 0;
}

export interface HashResult {
  algorithm: string;
  value: string;
  matches: boolean | null; // null if no expected hash provided
}

export function computeAllHashes(input: string, expectedHash: string): HashResult[] {
  const expected = expectedHash.trim().toLowerCase();

  const hashes: Array<{ algorithm: string; value: string }> = [
    { algorithm: 'MD5', value: CryptoJS.MD5(input).toString() },
    { algorithm: 'SHA-1', value: CryptoJS.SHA1(input).toString() },
    { algorithm: 'SHA-224', value: CryptoJS.SHA224(input).toString() },
    { algorithm: 'SHA-256', value: CryptoJS.SHA256(input).toString() },
    { algorithm: 'SHA-384', value: CryptoJS.SHA384(input).toString() },
    { algorithm: 'SHA-512', value: CryptoJS.SHA512(input).toString() },
    { algorithm: 'CRC32', value: crc32(input).toString(16).toUpperCase().padStart(8, '0') },
    { algorithm: 'Adler-32', value: adler32(input).toString(16).toUpperCase().padStart(8, '0') },
    { algorithm: 'xxHash32', value: xxHash32(input).toString(16).toUpperCase().padStart(8, '0') },
  ];

  return hashes.map(h => ({
    algorithm: h.algorithm,
    value: h.value,
    matches: expected.length > 0 ? h.value.toLowerCase() === expected : null,
  }));
}
