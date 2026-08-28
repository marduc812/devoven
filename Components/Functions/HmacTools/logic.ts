// HMAC Generator logic — pure TypeScript, no browser APIs
// Supports SHA-256, SHA-512, SHA-1 via CryptoJS (available in the project)
// This module wraps CryptoJS for consistent interface

export type HmacAlgorithm = 'SHA-256' | 'SHA-512' | 'SHA-1' | 'MD5';

export interface HmacResult {
  algorithm: HmacAlgorithm;
  hex: string;
  base64: string;
  byteLength: number;
}

// Pure JS SHA-256 implementation (no browser APIs)
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Bytes(msgBytes: number[]): number[] {
  const K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H: number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const msg = msgBytes.slice();
  const bitLen = msg.length * 8;
  msg.push(0x80);
  while ((msg.length % 64) !== 56) msg.push(0);

  // Append 64-bit big-endian bit length (only lower 32 bits used for reasonable inputs)
  msg.push(0, 0, 0, 0);
  msg.push((bitLen >>> 24) & 0xff);
  msg.push((bitLen >>> 16) & 0xff);
  msg.push((bitLen >>> 8) & 0xff);
  msg.push(bitLen & 0xff);

  for (let chunkStart = 0; chunkStart < msg.length; chunkStart += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {
      w[i] =
        (msg[chunkStart + i * 4] << 24) |
        (msg[chunkStart + i * 4 + 1] << 16) |
        (msg[chunkStart + i * 4 + 2] << 8) |
        msg[chunkStart + i * 4 + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g; g = f; f = e;
      e = (d + temp1) | 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  const result: number[] = [];
  for (let i = 0; i < 8; i++) {
    result.push((H[i] >>> 24) & 0xff);
    result.push((H[i] >>> 16) & 0xff);
    result.push((H[i] >>> 8) & 0xff);
    result.push(H[i] & 0xff);
  }
  return result;
}

// SHA-1 implementation
function sha1Bytes(msgBytes: number[]): number[] {
  let H: number[] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  const msg = msgBytes.slice();
  const bitLen = msg.length * 8;
  msg.push(0x80);
  while ((msg.length % 64) !== 56) msg.push(0);
  msg.push(0, 0, 0, 0);
  msg.push((bitLen >>> 24) & 0xff);
  msg.push((bitLen >>> 16) & 0xff);
  msg.push((bitLen >>> 8) & 0xff);
  msg.push(bitLen & 0xff);

  for (let chunkStart = 0; chunkStart < msg.length; chunkStart += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {
      w[i] =
        (msg[chunkStart + i * 4] << 24) |
        (msg[chunkStart + i * 4 + 1] << 16) |
        (msg[chunkStart + i * 4 + 2] << 8) |
        msg[chunkStart + i * 4 + 3];
    }
    for (let i = 16; i < 80; i++) {
      const val = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (val << 1) | (val >>> 31);
    }

    let [a, b, c, d, e] = H;

    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) | 0;
      e = d; d = c;
      c = ((b << 30) | (b >>> 2));
      b = a; a = temp;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
  }

  const result: number[] = [];
  for (let i = 0; i < 5; i++) {
    result.push((H[i] >>> 24) & 0xff);
    result.push((H[i] >>> 16) & 0xff);
    result.push((H[i] >>> 8) & 0xff);
    result.push(H[i] & 0xff);
  }
  return result;
}

// MD5 implementation
function md5Bytes(msgBytes: number[]): number[] {
  const T: number[] = [];
  for (let i = 0; i < 64; i++) {
    T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  const S: number[] = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const msg = msgBytes.slice();
  const origLen = msg.length;
  msg.push(0x80);
  while ((msg.length % 64) !== 56) msg.push(0);
  const bitLen = origLen * 8;
  msg.push(bitLen & 0xff, (bitLen >>> 8) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 24) & 0xff,
           0, 0, 0, 0);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < msg.length; chunkStart += 64) {
    const M: number[] = [];
    for (let i = 0; i < 16; i++) {
      M[i] =
        msg[chunkStart + i * 4] |
        (msg[chunkStart + i * 4 + 1] << 8) |
        (msg[chunkStart + i * 4 + 2] << 16) |
        (msg[chunkStart + i * 4 + 3] << 24);
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }

      F = (F + A + T[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) | 0;
    }

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  function toLittleEndian(n: number): number[] {
    return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  }
  return [...toLittleEndian(a0), ...toLittleEndian(b0), ...toLittleEndian(c0), ...toLittleEndian(d0)];
}

// SHA-512 — simplified: we use a 32-bit simulation (not real SHA-512)
// Real SHA-512 requires 64-bit arithmetic. We implement it using number pairs.
// For correctness, we use a known-good implementation approach with number arrays.
function sha512Bytes(msgBytes: number[]): number[] {
  // SHA-512 initial hash values (first 64 bits of fractional parts of sqrt of first 8 primes)
  // Stored as [hi, lo] pairs of 32-bit numbers
  const H: Array<[number, number]> = [
    [0x6a09e667, 0xf3bcc908], [0xbb67ae85, 0x84caa73b],
    [0x3c6ef372, 0xfe94f82b], [0xa54ff53a, 0x5f1d36f1],
    [0x510e527f, 0xade682d1], [0x9b05688c, 0x2b3e6c1f],
    [0x1f83d9ab, 0xfb41bd6b], [0x5be0cd19, 0x137e2179],
  ];

  const K: Array<[number, number]> = [
    [0x428a2f98,0xd728ae22],[0x71374491,0x23ef65cd],[0xb5c0fbcf,0xec4d3b2f],[0xe9b5dba5,0x8189dbbc],
    [0x3956c25b,0xf348b538],[0x59f111f1,0xb605d019],[0x923f82a4,0xaf194f9b],[0xab1c5ed5,0xda6d8118],
    [0xd807aa98,0xa3030242],[0x12835b01,0x45706fbe],[0x243185be,0x4ee4b28c],[0x550c7dc3,0xd5ffb4e2],
    [0x72be5d74,0xf27b896f],[0x80deb1fe,0x3b1696b1],[0x9bdc06a7,0x25c71235],[0xc19bf174,0xcf692694],
    [0xe49b69c1,0xef14ad2a],[0xefbe4786,0x384f25e3],[0x0fc19dc6,0x8b8cd5b5],[0x240ca1cc,0x77ac9c65],
    [0x2de92c6f,0x592b0275],[0x4a7484aa,0x6ea6e483],[0x5cb0a9dc,0xbd41fbd4],[0x76f988da,0x831153b5],
    [0x983e5152,0xee66dfab],[0xa831c66d,0x2db43210],[0xb00327c8,0x98fb213f],[0xbf597fc7,0xbeef0ee4],
    [0xc6e00bf3,0x3da88fc2],[0xd5a79147,0x930aa725],[0x06ca6351,0xe003826f],[0x14292967,0x0a0e6e70],
    [0x27b70a85,0x46d22ffc],[0x2e1b2138,0x5c26c926],[0x4d2c6dfc,0x5ac42aed],[0x53380d13,0x9d95b3df],
    [0x650a7354,0x8baf63de],[0x766a0abb,0x3c77b2a8],[0x81c2c92e,0x47edaee6],[0x92722c85,0x1482353b],
    [0xa2bfe8a1,0x4cf10364],[0xa81a664b,0xbc423001],[0xc24b8b70,0xd0f89791],[0xc76c51a3,0x0654be30],
    [0xd192e819,0xd6ef5218],[0xd6990624,0x5565a910],[0xf40e3585,0x5771202a],[0x106aa070,0x32bbd1b8],
    [0x19a4c116,0xb8d2d0c8],[0x1e376c08,0x5141ab53],[0x2748774c,0xdf8eeb99],[0x34b0bcb5,0xe19b48a8],
    [0x391c0cb3,0xc5c95a63],[0x4ed8aa4a,0xe3418acb],[0x5b9cca4f,0x7763e373],[0x682e6ff3,0xd6b2b8a3],
    [0x748f82ee,0x5defb2fc],[0x78a5636f,0x43172f60],[0x84c87814,0xa1f0ab72],[0x8cc70208,0x1a6439ec],
    [0x90befffa,0x23631e28],[0xa4506ceb,0xde82bde9],[0xbef9a3f7,0xb2c67915],[0xc67178f2,0xe372532b],
    [0xca273ece,0xea26619c],[0xd186b8c7,0x21c0c207],[0xeada7dd6,0xcde0eb1e],[0xf57d4f7f,0xee6ed178],
    [0x06f067aa,0x72176fba],[0x0a637dc5,0xa2c898a6],[0x113f9804,0xbef90dae],[0x1b710b35,0x131c471b],
    [0x28db77f5,0x23047d84],[0x32caab7b,0x40c72493],[0x3c9ebe0a,0x15c9bebc],[0x431d67c4,0x9c100d4c],
    [0x4cc5d4be,0xcb3e42b6],[0x597f299c,0xfc657e2a],[0x5fcb6fab,0x3ad6faec],[0x6c44198c,0x4a475817],
  ];

  function add64(a: [number, number], b: [number, number]): [number, number] {
    const lo = (a[1] + b[1]) >>> 0;
    const hi = ((a[0] + b[0]) + (((a[1] >>> 0) + (b[1] >>> 0)) > 0xffffffff ? 1 : 0)) >>> 0;
    return [hi, lo];
  }

  function rotr64(x: [number, number], n: number): [number, number] {
    if (n === 0) return x;
    if (n < 32) {
      return [
        ((x[0] >>> n) | (x[1] << (32 - n))) >>> 0,
        ((x[1] >>> n) | (x[0] << (32 - n))) >>> 0,
      ];
    }
    n = n - 32;
    return [
      ((x[1] >>> n) | (x[0] << (32 - n))) >>> 0,
      ((x[0] >>> n) | (x[1] << (32 - n))) >>> 0,
    ];
  }

  function shr64(x: [number, number], n: number): [number, number] {
    if (n < 32) {
      return [(x[0] >>> n) >>> 0, ((x[1] >>> n) | (x[0] << (32 - n))) >>> 0];
    }
    return [0, (x[0] >>> (n - 32)) >>> 0];
  }

  function xor64(a: [number, number], b: [number, number]): [number, number] {
    return [(a[0] ^ b[0]) >>> 0, (a[1] ^ b[1]) >>> 0];
  }

  function and64(a: [number, number], b: [number, number]): [number, number] {
    return [(a[0] & b[0]) >>> 0, (a[1] & b[1]) >>> 0];
  }

  function not64(a: [number, number]): [number, number] {
    return [(~a[0]) >>> 0, (~a[1]) >>> 0];
  }

  const msg = msgBytes.slice();
  const origBitLen = msg.length * 8;
  msg.push(0x80);
  while ((msg.length % 128) !== 112) msg.push(0);
  // 16 bytes for length (we only use lower 8 bytes for length)
  for (let i = 0; i < 8; i++) msg.push(0);
  // origBitLen as 8-byte big-endian
  msg.push(
    (origBitLen / 0x1000000 / 0x1000000 / 0x100) & 0xff,
    (origBitLen / 0x1000000 / 0x1000000) & 0xff,
    (origBitLen / 0x1000000 / 0x10000) & 0xff,
    (origBitLen / 0x1000000 / 0x100) & 0xff,
    (origBitLen / 0x1000000) & 0xff,
    (origBitLen >>> 16) & 0xff,
    (origBitLen >>> 8) & 0xff,
    origBitLen & 0xff,
  );

  for (let chunkStart = 0; chunkStart < msg.length; chunkStart += 128) {
    const w: Array<[number, number]> = [];
    for (let i = 0; i < 16; i++) {
      const off = chunkStart + i * 8;
      w[i] = [
        ((msg[off] << 24) | (msg[off+1] << 16) | (msg[off+2] << 8) | msg[off+3]) >>> 0,
        ((msg[off+4] << 24) | (msg[off+5] << 16) | (msg[off+6] << 8) | msg[off+7]) >>> 0,
      ];
    }
    for (let i = 16; i < 80; i++) {
      const s0 = xor64(xor64(rotr64(w[i-15], 1), rotr64(w[i-15], 8)), shr64(w[i-15], 7));
      const s1 = xor64(xor64(rotr64(w[i-2], 19), rotr64(w[i-2], 61)), shr64(w[i-2], 6));
      w[i] = add64(add64(w[i-16], s0), add64(w[i-7], s1));
    }

    let [a, b, c, d, e, f, g, h] = H.map(x => x.slice() as [number, number]);

    for (let i = 0; i < 80; i++) {
      const S1 = xor64(xor64(rotr64(e, 14), rotr64(e, 18)), rotr64(e, 41));
      const ch = xor64(and64(e, f), and64(not64(e), g));
      const temp1 = add64(add64(h, S1), add64(ch, add64(K[i], w[i])));
      const S0 = xor64(xor64(rotr64(a, 28), rotr64(a, 34)), rotr64(a, 39));
      const maj = xor64(xor64(and64(a, b), and64(a, c)), and64(b, c));
      const temp2 = add64(S0, maj);

      h = g; g = f; f = e;
      e = add64(d, temp1);
      d = c; c = b; b = a;
      a = add64(temp1, temp2);
    }

    H[0] = add64(H[0], a);
    H[1] = add64(H[1], b);
    H[2] = add64(H[2], c);
    H[3] = add64(H[3], d);
    H[4] = add64(H[4], e);
    H[5] = add64(H[5], f);
    H[6] = add64(H[6], g);
    H[7] = add64(H[7], h);
  }

  const result: number[] = [];
  for (let i = 0; i < 8; i++) {
    result.push((H[i][0] >>> 24) & 0xff, (H[i][0] >>> 16) & 0xff, (H[i][0] >>> 8) & 0xff, H[i][0] & 0xff);
    result.push((H[i][1] >>> 24) & 0xff, (H[i][1] >>> 16) & 0xff, (H[i][1] >>> 8) & 0xff, H[i][1] & 0xff);
  }
  return result;
}

function strToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function bytesToBase64(bytes: number[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++] || 0;
    const b1 = bytes[i++];
    const b2 = bytes[i++];
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | ((b1 !== undefined ? b1 : 0) >> 4)];
    result += b1 !== undefined ? chars[((b1 & 0xf) << 2) | ((b2 !== undefined ? b2 : 0) >> 6)] : '=';
    result += b2 !== undefined ? chars[b2 & 0x3f] : '=';
  }
  return result;
}

function hmacCompute(
  hashFn: (bytes: number[]) => number[],
  blockSize: number,
  keyBytes: number[],
  msgBytes: number[],
): number[] {
  // If key longer than block size, hash it
  let k = keyBytes.slice();
  if (k.length > blockSize) k = hashFn(k);
  // Pad key to block size
  while (k.length < blockSize) k.push(0);

  const ipad = k.map(b => b ^ 0x36);
  const opad = k.map(b => b ^ 0x5c);

  const innerHash = hashFn([...ipad, ...msgBytes]);
  return hashFn([...opad, ...innerHash]);
}

export function generateHmac(message: string, key: string, algorithm: HmacAlgorithm): HmacResult {
  const keyBytes = strToBytes(key);
  const msgBytes = strToBytes(message);

  let hashBytes: number[];
  let blockSize: number;

  if (algorithm === 'SHA-256') {
    blockSize = 64;
    hashBytes = hmacCompute(sha256Bytes, blockSize, keyBytes, msgBytes);
  } else if (algorithm === 'SHA-512') {
    blockSize = 128;
    hashBytes = hmacCompute(sha512Bytes, blockSize, keyBytes, msgBytes);
  } else if (algorithm === 'SHA-1') {
    blockSize = 64;
    hashBytes = hmacCompute(sha1Bytes, blockSize, keyBytes, msgBytes);
  } else {
    // MD5
    blockSize = 64;
    hashBytes = hmacCompute(md5Bytes, blockSize, keyBytes, msgBytes);
  }

  return {
    algorithm,
    hex: bytesToHex(hashBytes),
    base64: bytesToBase64(hashBytes),
    byteLength: hashBytes.length,
  };
}

export function generateAllHmacs(message: string, key: string): HmacResult[] {
  if (!message || !key) return [];
  const algorithms: HmacAlgorithm[] = ['SHA-256', 'SHA-512', 'SHA-1', 'MD5'];
  return algorithms.map(algo => generateHmac(message, key, algo));
}
