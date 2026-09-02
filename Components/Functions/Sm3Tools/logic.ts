// ─── SM3 (GB/T 32905-2016) ───────────────────────────────────────────────────
// China's national 256-bit hash standard, mandatory in SM2 signatures and
// TLCP/GM TLS. Structurally close to SHA-256 — same padding, same 32-bit words,
// different message expansion and round function.
//
// Written from the standard because @noble/hashes does not ship it. Verified
// against Node's OpenSSL `sm3` over every input length up to 300 bytes.

const IV = new Uint32Array([
  0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
  0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e,
]);

const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;

/** Boolean function FF_j. Splits at round 16, as does GG_j. */
const ff = (j: number, x: number, y: number, z: number) =>
  j < 16 ? x ^ y ^ z : (x & y) | (x & z) | (y & z);

const gg = (j: number, x: number, y: number, z: number) =>
  j < 16 ? x ^ y ^ z : (x & y) | (~x & z);

const p0 = (x: number) => (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0;
const p1 = (x: number) => (x ^ rotl(x, 15) ^ rotl(x, 23)) >>> 0;

/** SM3 over raw bytes. Returns the 32-byte digest. */
export function sm3Bytes(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;

  // Merkle-Damgard padding identical to SHA-256: 0x80, zeros, 64-bit big-endian
  // bit count.
  const padded = new Uint8Array(
    input.length + 1 + ((56 - ((input.length + 1) % 64) + 64) % 64) + 8,
  );
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000) >>> 0, false);
  view.setUint32(padded.length - 4, bitLength >>> 0, false);

  const v = new Uint32Array(IV);
  const w = new Uint32Array(68);
  const w1 = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let j = 16; j < 68; j++) {
      w[j] =
        (p1((w[j - 16] ^ w[j - 9] ^ rotl(w[j - 3], 15)) >>> 0) ^
          rotl(w[j - 13], 7) ^
          w[j - 6]) >>>
        0;
    }
    for (let j = 0; j < 64; j++) w1[j] = (w[j] ^ w[j + 4]) >>> 0;

    let a = v[0];
    let b = v[1];
    let c = v[2];
    let d = v[3];
    let e = v[4];
    let f = v[5];
    let g = v[6];
    let h = v[7];

    for (let j = 0; j < 64; j++) {
      // T_j is rotated by j, and j exceeds 31 in the second half, so the shift
      // has to wrap explicitly — JS `<<` would already wrap, but relying on
      // that hides the spec's `j mod 32`.
      const t = j < 16 ? 0x79cc4519 : 0x7a879d8a;
      const a12 = rotl(a, 12);
      const ss1 = rotl((a12 + e + rotl(t, j % 32)) >>> 0, 7);
      const ss2 = (ss1 ^ a12) >>> 0;
      const tt1 = (ff(j, a, b, c) + d + ss2 + w1[j]) >>> 0;
      const tt2 = (gg(j, e, f, g) + h + ss1 + w[j]) >>> 0;

      d = c;
      c = rotl(b, 9);
      b = a;
      a = tt1;
      h = g;
      g = rotl(f, 19);
      f = e;
      e = p0(tt2);
    }

    v[0] = (v[0] ^ a) >>> 0;
    v[1] = (v[1] ^ b) >>> 0;
    v[2] = (v[2] ^ c) >>> 0;
    v[3] = (v[3] ^ d) >>> 0;
    v[4] = (v[4] ^ e) >>> 0;
    v[5] = (v[5] ^ f) >>> 0;
    v[6] = (v[6] ^ g) >>> 0;
    v[7] = (v[7] ^ h) >>> 0;
  }

  const digest = new Uint8Array(32);
  const out = new DataView(digest.buffer);
  for (let i = 0; i < 8; i++) out.setUint32(i * 4, v[i], false);
  return digest;
}

/** SM3 of a UTF-8 encoded string, as lowercase hex. */
export function sm3(text: string): string {
  return Array.from(sm3Bytes(new TextEncoder().encode(text)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** HMAC-SM3 (RFC 2104 over SM3's 64-byte block). */
export function hmacSm3(message: string, key: string): string {
  const encoder = new TextEncoder();
  const blockSize = 64;

  const encoded = encoder.encode(key);
  const keyBytes = encoded.length > blockSize ? sm3Bytes(encoded) : encoded;

  const inner = new Uint8Array(blockSize);
  const outer = new Uint8Array(blockSize);
  inner.set(keyBytes);
  outer.set(keyBytes);
  for (let i = 0; i < blockSize; i++) {
    inner[i] ^= 0x36;
    outer[i] ^= 0x5c;
  }

  const messageBytes = encoder.encode(message);
  const innerInput = new Uint8Array(blockSize + messageBytes.length);
  innerInput.set(inner);
  innerInput.set(messageBytes, blockSize);
  const innerDigest = sm3Bytes(innerInput);

  const outerInput = new Uint8Array(blockSize + innerDigest.length);
  outerInput.set(outer);
  outerInput.set(innerDigest, blockSize);

  return Array.from(sm3Bytes(outerInput))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
