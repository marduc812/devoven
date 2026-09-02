// ─── MD4 (RFC 1320) ──────────────────────────────────────────────────────────
// Lifted out of the NTLM tool, which has always needed MD4 underneath. Broken
// out here so the standalone MD4 page, the NTLM page, and the Blocks pipeline
// all run the same implementation instead of three copies.
//
// MD4 is cryptographically broken — collisions are trivial. It stays useful for
// NTLM, rsync, and old file formats, which is the only reason to compute one.

const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
const G = (x: number, y: number, z: number) => (x & y) | (x & z) | (y & z);
const H = (x: number, y: number, z: number) => x ^ y ^ z;
const rotl = (v: number, n: number) => (v << n) | (v >>> (32 - n));

const ROUND1_INDEX = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const ROUND1_SHIFT = [3, 7, 11, 19, 3, 7, 11, 19, 3, 7, 11, 19, 3, 7, 11, 19];
const ROUND2_INDEX = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
const ROUND2_SHIFT = [3, 5, 9, 13, 3, 5, 9, 13, 3, 5, 9, 13, 3, 5, 9, 13];
const ROUND3_INDEX = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
const ROUND3_SHIFT = [3, 9, 11, 15, 3, 9, 11, 15, 3, 9, 11, 15, 3, 9, 11, 15];

/** MD4 over raw bytes. Returns the 16-byte digest. */
export function md4Bytes(input: Uint8Array): Uint8Array {
  const msgLen = input.length;
  const bitLen = msgLen * 8;

  const padLen = (56 - ((msgLen + 1) % 64) + 64) % 64;
  const padded = new Uint8Array(msgLen + 1 + padLen + 8);
  padded.set(input);
  padded[msgLen] = 0x80;

  const view = new DataView(padded.buffer);
  // Length is a 64-bit little-endian bit count. Splitting it keeps inputs past
  // 512 MB correct instead of silently wrapping at 2^32 bits.
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const X = new Uint32Array(16);

  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) X[j] = view.getUint32(i + j * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let j = 0; j < 16; j++) {
      const t = (a + F(b, c, d) + X[ROUND1_INDEX[j]]) >>> 0;
      a = d; d = c; c = b; b = rotl(t, ROUND1_SHIFT[j]);
    }
    for (let j = 0; j < 16; j++) {
      const t = (a + G(b, c, d) + X[ROUND2_INDEX[j]] + 0x5a827999) >>> 0;
      a = d; d = c; c = b; b = rotl(t, ROUND2_SHIFT[j]);
    }
    for (let j = 0; j < 16; j++) {
      const t = (a + H(b, c, d) + X[ROUND3_INDEX[j]] + 0x6ed9eba1) >>> 0;
      a = d; d = c; c = b; b = rotl(t, ROUND3_SHIFT[j]);
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const digest = new Uint8Array(16);
  const out = new DataView(digest.buffer);
  out.setUint32(0, a0, true);
  out.setUint32(4, b0, true);
  out.setUint32(8, c0, true);
  out.setUint32(12, d0, true);
  return digest;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** MD4 over raw bytes, as lowercase hex. */
export function md4Hex(input: Uint8Array): string {
  return toHex(md4Bytes(input));
}

/** MD4 of a UTF-8 encoded string — what "MD4 of this text" means everywhere else. */
export function md4(text: string): string {
  return md4Hex(new TextEncoder().encode(text));
}

/** NTLM: MD4 of the password encoded UTF-16LE. */
export function ntlmHash(password: string): string {
  const utf16le = new Uint8Array(password.length * 2);
  for (let i = 0; i < password.length; i++) {
    const code = password.charCodeAt(i);
    utf16le[i * 2] = code & 0xff;
    utf16le[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return md4Hex(utf16le);
}
