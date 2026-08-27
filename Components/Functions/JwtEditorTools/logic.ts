export type JwtAlgorithm =
  | 'HS256' | 'HS384' | 'HS512'
  | 'RS256' | 'RS384' | 'RS512'
  | 'PS256' | 'PS384' | 'PS512'
  | 'ES256' | 'ES384' | 'ES512'
  | 'EdDSA'
  | 'none';

export type JwtAlgFamily = 'HMAC' | 'RSA' | 'RSA-PSS' | 'EC' | 'EdDSA' | 'none';

type AlgInfo = {
  family: JwtAlgFamily;
  hash?: 'SHA-256' | 'SHA-384' | 'SHA-512';
  namedCurve?: string;
};

export const ALG_INFO: Record<JwtAlgorithm, AlgInfo> = {
  HS256: { family: 'HMAC', hash: 'SHA-256' },
  HS384: { family: 'HMAC', hash: 'SHA-384' },
  HS512: { family: 'HMAC', hash: 'SHA-512' },
  RS256: { family: 'RSA', hash: 'SHA-256' },
  RS384: { family: 'RSA', hash: 'SHA-384' },
  RS512: { family: 'RSA', hash: 'SHA-512' },
  PS256: { family: 'RSA-PSS', hash: 'SHA-256' },
  PS384: { family: 'RSA-PSS', hash: 'SHA-384' },
  PS512: { family: 'RSA-PSS', hash: 'SHA-512' },
  ES256: { family: 'EC', hash: 'SHA-256', namedCurve: 'P-256' },
  ES384: { family: 'EC', hash: 'SHA-384', namedCurve: 'P-384' },
  ES512: { family: 'EC', hash: 'SHA-512', namedCurve: 'P-521' },
  EdDSA: { family: 'EdDSA', namedCurve: 'Ed25519' },
  none: { family: 'none' },
};

export const ALL_ALGORITHMS = Object.keys(ALG_INFO) as JwtAlgorithm[];

export function algFamily(alg: JwtAlgorithm): JwtAlgFamily {
  return ALG_INFO[alg].family;
}

export function isAsymmetric(alg: JwtAlgorithm): boolean {
  const f = ALG_INFO[alg].family;
  return f === 'RSA' || f === 'RSA-PSS' || f === 'EC' || f === 'EdDSA';
}

// Keys are interchangeable within a "group" — e.g. one RSA pair signs every RS*/PS*
// variant, while each EC curve and Ed25519 needs its own pair. Used to decide whether
// a generated/pasted key can be reused when switching algorithms.
export function keyGroup(alg: JwtAlgorithm): string {
  const info = ALG_INFO[alg];
  if (info.family === 'RSA' || info.family === 'RSA-PSS') return 'RSA';
  if (info.family === 'EC') return info.namedCurve as string;
  if (info.family === 'EdDSA') return 'Ed25519';
  return '';
}

function getSubtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || !c.subtle) {
    throw new Error('WebCrypto is not available in this environment');
  }
  return c.subtle;
}

// Base64url encoding (no padding, url-safe chars)
export function base64urlEncode(data: number[]): string {
  let b64 = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = data;
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    b64 += chars[(b0 >> 2) & 0x3f];
    b64 += chars[((b0 & 0x03) << 4) | ((b1 >> 4) & 0x0f)];
    b64 += chars[((b1 & 0x0f) << 2) | ((b2 >> 6) & 0x03)];
    b64 += chars[b2 & 0x3f];
  }
  // Trim padding based on length
  const padLen = bytes.length % 3;
  if (padLen === 1) b64 = b64.slice(0, -2);
  else if (padLen === 2) b64 = b64.slice(0, -1);
  // Make URL-safe
  return b64.replace(/\+/g, '-').replace(/\//g, '_');
}

export function base64urlEncodeString(str: string): string {
  return base64urlEncode(stringToBytes(str));
}

export function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code < 2048) {
      bytes.push((code >> 6) | 192);
      bytes.push((code & 63) | 128);
    } else {
      bytes.push((code >> 12) | 224);
      bytes.push(((code >> 6) & 63) | 128);
      bytes.push((code & 63) | 128);
    }
  }
  return bytes;
}

// --- SHA-256 pure JS implementation ---
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(msgBytes: number[]): number[] {
  const K = [
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

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const msg = msgBytes.slice();
  const bitLen = msg.length * 8;
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  // Append bit length as 64-bit big-endian (only lower 32 bits matter for <512MB)
  msg.push(0, 0, 0, 0);
  msg.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

  for (let chunk = 0; chunk < msg.length; chunk += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {
      w[i] = (msg[chunk + i * 4] << 24) | (msg[chunk + i * 4 + 1] << 16) |
              (msg[chunk + i * 4 + 2] << 8) | msg[chunk + i * 4 + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const result: number[] = [];
  for (const hv of [h0, h1, h2, h3, h4, h5, h6, h7]) {
    result.push((hv >>> 24) & 0xff, (hv >>> 16) & 0xff, (hv >>> 8) & 0xff, hv & 0xff);
  }
  return result;
}

// SHA-384: uses 64-bit words — we simulate using pairs of 32-bit numbers
function sha384(msgBytes: number[]): number[] {
  const H: number[][] = [
    [0xcbbb9d5d, 0xc1059ed8], [0x629a292a, 0x367cd507],
    [0x9159015a, 0x3070dd17], [0x152fecd8, 0xf70e5939],
    [0x67332667, 0xffc00b31], [0x8eb44a87, 0x68581511],
    [0xdb0c2e0d, 0x64f98fa7], [0x47b5481d, 0xbefa4fa4],
  ];
  return sha512core(msgBytes, H, 48);
}

function sha512(msgBytes: number[]): number[] {
  const H: number[][] = [
    [0x6a09e667, 0xf3bcc908], [0xbb67ae85, 0x84caa73b],
    [0x3c6ef372, 0xfe94f82b], [0xa54ff53a, 0x5f1d36f1],
    [0x510e527f, 0xade682d1], [0x9b05688c, 0x2b3e6c1f],
    [0x1f83d9ab, 0xfb41bd6b], [0x5be0cd19, 0x137e2179],
  ];
  return sha512core(msgBytes, H, 64);
}

// 64-bit addition using pairs of 32-bit numbers
function add64(ah: number, al: number, bh: number, bl: number): [number, number] {
  const lo = (al + bl) >>> 0;
  const carry = (al + bl) > 0xffffffff ? 1 : 0;
  const hi = (ah + bh + carry) >>> 0;
  return [hi, lo];
}

function rotr64(ah: number, al: number, n: number): [number, number] {
  if (n < 32) {
    return [(ah >>> n) | (al << (32 - n)), (al >>> n) | (ah << (32 - n))];
  }
  n -= 32;
  return [(al >>> n) | (ah << (32 - n)), (ah >>> n) | (al << (32 - n))];
}

function shr64(ah: number, al: number, n: number): [number, number] {
  if (n < 32) return [ah >>> n, (al >>> n) | (ah << (32 - n))];
  return [0, ah >>> (n - 32)];
}

function xor64(ah: number, al: number, bh: number, bl: number): [number, number] {
  return [ah ^ bh, al ^ bl];
}

const K512: number[][] = [
  [0x428a2f98,0xd728ae22],[0x71374491,0x23ef65cd],[0xb5c0fbcf,0xec4d3b2f],[0xe9b5dba5,0x8189dbbc],
  [0x3956c25b,0xf348b538],[0x59f111f1,0xb605d019],[0x923f82a4,0xaf194f9b],[0xab1c5ed5,0xda6d8118],
  [0xd807aa98,0xa3030242],[0x12835b01,0x45706fbe],[0x243185be,0x4ee4b28c],[0x550c7dc3,0xd5ffb4e2],
  [0x72be5d74,0xf27b896f],[0x80deb1fe,0x3b1696b1],[0x9bdc06a7,0x25c71235],[0xc19bf174,0xcf692694],
  [0xe49b69c1,0x9ef14ad2],[0xefbe4786,0x384f25e3],[0x0fc19dc6,0x8b8cd5b5],[0x240ca1cc,0x77ac9c65],
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

function sha512core(msgBytes: number[], H: number[][], outLen: number): number[] {
  const msg = msgBytes.slice();
  // Bit length as 128-bit number (we only use lower 64 bits = upper 32 bits all 0)
  const bitLenLo = (msg.length * 8) >>> 0;
  const bitLenHi = Math.floor(msg.length / 0x20000000); // msg.length * 8 >> 32
  msg.push(0x80);
  while (msg.length % 128 !== 112) msg.push(0);
  // 16 bytes for length (big-endian 128-bit)
  for (let i = 0; i < 8; i++) msg.push(0); // high 64 bits zero
  msg.push((bitLenHi >>> 24) & 0xff, (bitLenHi >>> 16) & 0xff, (bitLenHi >>> 8) & 0xff, bitLenHi & 0xff);
  msg.push((bitLenLo >>> 24) & 0xff, (bitLenLo >>> 16) & 0xff, (bitLenLo >>> 8) & 0xff, bitLenLo & 0xff);

  // Working copy of H
  const h = H.map(pair => [pair[0], pair[1]]);

  for (let chunk = 0; chunk < msg.length; chunk += 128) {
    const w: number[][] = [];
    for (let i = 0; i < 16; i++) {
      const off = chunk + i * 8;
      w.push([
        (msg[off] << 24) | (msg[off+1] << 16) | (msg[off+2] << 8) | msg[off+3],
        (msg[off+4] << 24) | (msg[off+5] << 16) | (msg[off+6] << 8) | msg[off+7],
      ]);
    }
    for (let i = 16; i < 80; i++) {
      const [r1h, r1l] = rotr64(w[i-15][0], w[i-15][1], 1);
      const [r2h, r2l] = rotr64(w[i-15][0], w[i-15][1], 8);
      const [s3h, s3l] = shr64(w[i-15][0], w[i-15][1], 7);
      const [s0h, s0l] = xor64(r1h^r2h, r1l^r2l, s3h, s3l);

      const [r4h, r4l] = rotr64(w[i-2][0], w[i-2][1], 19);
      const [r5h, r5l] = rotr64(w[i-2][0], w[i-2][1], 61);
      const [s6h, s6l] = shr64(w[i-2][0], w[i-2][1], 6);
      const [s1h, s1l] = xor64(r4h^r5h, r4l^r5l, s6h, s6l);

      let [wh, wl] = add64(w[i-16][0], w[i-16][1], s0h, s0l);
      [wh, wl] = add64(wh, wl, w[i-7][0], w[i-7][1]);
      [wh, wl] = add64(wh, wl, s1h, s1l);
      w.push([wh, wl]);
    }

    let [ah, al] = h[0]; let [bh, bl] = h[1]; let [ch, cl] = h[2]; let [dh, dl] = h[3];
    let [eh, el] = h[4]; let [fh, fl] = h[5]; let [gh, gl] = h[6]; let [hh, hl] = h[7];

    for (let i = 0; i < 80; i++) {
      const [r6h, r6l] = rotr64(eh, el, 14);
      const [r7h, r7l] = rotr64(eh, el, 18);
      const [r8h, r8l] = rotr64(eh, el, 41);
      const S1h = r6h ^ r7h ^ r8h;
      const S1l = r6l ^ r7l ^ r8l;
      const chH = (eh & fh) ^ (~eh & gh);
      const chL = (el & fl) ^ (~el & gl);
      let [t1h, t1l] = add64(hh, hl, S1h, S1l);
      [t1h, t1l] = add64(t1h, t1l, chH, chL);
      [t1h, t1l] = add64(t1h, t1l, K512[i][0], K512[i][1]);
      [t1h, t1l] = add64(t1h, t1l, w[i][0], w[i][1]);

      const [r9h, r9l] = rotr64(ah, al, 28);
      const [r10h, r10l] = rotr64(ah, al, 34);
      const [r11h, r11l] = rotr64(ah, al, 39);
      const S0h = r9h ^ r10h ^ r11h;
      const S0l = r9l ^ r10l ^ r11l;
      const majH = (ah & bh) ^ (ah & ch) ^ (bh & ch);
      const majL = (al & bl) ^ (al & cl) ^ (bl & cl);
      const [t2h, t2l] = add64(S0h, S0l, majH, majL);

      hh = gh; hl = gl;
      gh = fh; gl = fl;
      fh = eh; fl = el;
      [eh, el] = add64(dh, dl, t1h, t1l);
      dh = ch; dl = cl;
      ch = bh; cl = bl;
      bh = ah; bl = al;
      [ah, al] = add64(t1h, t1l, t2h, t2l);
    }

    [h[0][0], h[0][1]] = add64(h[0][0], h[0][1], ah, al);
    [h[1][0], h[1][1]] = add64(h[1][0], h[1][1], bh, bl);
    [h[2][0], h[2][1]] = add64(h[2][0], h[2][1], ch, cl);
    [h[3][0], h[3][1]] = add64(h[3][0], h[3][1], dh, dl);
    [h[4][0], h[4][1]] = add64(h[4][0], h[4][1], eh, el);
    [h[5][0], h[5][1]] = add64(h[5][0], h[5][1], fh, fl);
    [h[6][0], h[6][1]] = add64(h[6][0], h[6][1], gh, gl);
    [h[7][0], h[7][1]] = add64(h[7][0], h[7][1], hh, hl);
  }

  const result: number[] = [];
  const hashWords = outLen === 48 ? 6 : 8;
  for (let i = 0; i < hashWords; i++) {
    result.push((h[i][0] >>> 24) & 0xff, (h[i][0] >>> 16) & 0xff, (h[i][0] >>> 8) & 0xff, h[i][0] & 0xff);
    result.push((h[i][1] >>> 24) & 0xff, (h[i][1] >>> 16) & 0xff, (h[i][1] >>> 8) & 0xff, h[i][1] & 0xff);
  }
  return result;
}

// HMAC implementation
export function hmac(keyBytes: number[], msgBytes: number[], hashFn: (data: number[]) => number[]): number[] {
  const blockSize = hashFn === sha256 ? 64 : 128;
  let k = keyBytes.slice();
  if (k.length > blockSize) k = hashFn(k);
  while (k.length < blockSize) k.push(0);

  const ipad = k.map(b => b ^ 0x36);
  const opad = k.map(b => b ^ 0x5c);

  const inner = hashFn(ipad.concat(msgBytes));
  return hashFn(opad.concat(inner));
}

function hashFnFor(algorithm: JwtAlgorithm): (data: number[]) => number[] {
  switch (algorithm) {
    case 'HS256': return sha256;
    case 'HS384': return sha384;
    case 'HS512': return sha512;
    default: throw new Error(`${algorithm} is not an HMAC algorithm`);
  }
}

// Base64url decode to a UTF-8 string. Works in browser (atob) and node (Buffer).
export function base64urlDecode(s: string): string {
  const padded = s + '==='.slice((s.length + 3) % 4);
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'function') {
    const binary = atob(standard);
    // Decode binary string as UTF-8
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    return binary;
  }
  return Buffer.from(standard, 'base64').toString('utf8');
}

// HMAC keys are usually raw text, but a symmetric key can also be supplied as an
// "oct" JWK — {"kty":"oct","k":"<base64url>"} — the standard JSON form of a raw
// key. Decoding k lets the secret carry arbitrary *binary* bytes (e.g. the DER
// encoding of a public key in an RS→HS algorithm-confusion forgery) that a plain
// UTF-8 text secret cannot represent. Anything that isn't a valid oct JWK is used
// verbatim as text, so existing string secrets are unaffected.
export function hmacKeyBytes(secret: string): number[] {
  const trimmed = secret.trim();
  if (trimmed.startsWith('{')) {
    try {
      const jwk = JSON.parse(trimmed) as { kty?: string; k?: unknown };
      if (jwk.kty === 'oct' && typeof jwk.k === 'string') {
        return Array.from(base64urlToBytes(jwk.k));
      }
    } catch (_e) {
      /* not JSON — fall through to raw-text handling */
    }
  }
  return stringToBytes(secret);
}

export function buildJwt(
  headerJson: string,
  payloadJson: string,
  secret: string,
  algorithm: JwtAlgorithm
): string {
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(headerJson);
  } catch (_e) {
    throw new Error('Header JSON is invalid');
  }
  try {
    payload = JSON.parse(payloadJson);
  } catch (_e) {
    throw new Error('Payload JSON is invalid');
  }

  const headerEncoded = base64urlEncodeString(JSON.stringify(header));
  const payloadEncoded = base64urlEncodeString(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  // The "none" algorithm produces an unsigned token with an empty signature.
  if (algorithm === 'none') {
    return `${signingInput}.`;
  }

  const sig = hmac(hmacKeyBytes(secret), stringToBytes(signingInput), hashFnFor(algorithm));
  return `${signingInput}.${base64urlEncode(sig)}`;
}

export type JwtParts = {
  header: string;
  payload: string;
  signatureB64: string;
  algorithm: JwtAlgorithm | null;
};

// Decode a token into its (pretty-printed) parts. Throws on structurally invalid tokens.
export function decodeJwtParts(token: string): JwtParts {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: must have 3 parts separated by dots');
  }

  let header: string;
  let payload: string;
  let algorithm: JwtAlgorithm | null = null;

  try {
    const parsed = JSON.parse(base64urlDecode(parts[0]));
    header = JSON.stringify(parsed, null, 2);
    if (parsed && (ALL_ALGORITHMS as string[]).includes(parsed.alg)) {
      algorithm = parsed.alg;
    }
  } catch (_e) {
    header = base64urlDecode(parts[0]);
  }
  try {
    payload = JSON.stringify(JSON.parse(base64urlDecode(parts[1])), null, 2);
  } catch (_e) {
    payload = base64urlDecode(parts[1]);
  }

  return { header, payload, signatureB64: parts[2], algorithm };
}

// Verify an HMAC signature against a secret, using the algorithm declared in the
// token's own header. Returns false for unsupported algorithms or malformed tokens.
export function verifySignature(token: string, secret: string): boolean {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  let algorithm: JwtAlgorithm | null = null;
  try {
    const parsed = JSON.parse(base64urlDecode(parts[0]));
    if (['HS256', 'HS384', 'HS512', 'none'].includes(parsed.alg)) {
      algorithm = parsed.alg;
    }
  } catch (_e) {
    return false;
  }
  if (!algorithm) return false;
  // An unsigned ("none") token is structurally valid only when its signature is empty.
  if (algorithm === 'none') return parts[2] === '';
  if (ALG_INFO[algorithm].family !== 'HMAC') return false; // asymmetric handled by verifyJwt
  const signingInput = `${parts[0]}.${parts[1]}`;
  const expected = base64urlEncode(hmac(hmacKeyBytes(secret), stringToBytes(signingInput), hashFnFor(algorithm)));
  return expected === parts[2];
}

/* -------------------------------------------------------------------------- */
/*  Binary base64 / base64url helpers (for raw signatures and DER bytes)      */
/* -------------------------------------------------------------------------- */

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function base64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const padded = s + '==='.slice((s.length + 3) % 4);
  return base64ToBytes(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

function bytesToBase64url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* -------------------------------------------------------------------------- */
/*  PEM <-> DER                                                               */
/* -------------------------------------------------------------------------- */

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  if (!body) throw new Error('Key is empty or not valid PEM');
  return base64ToBytes(body).buffer;
}

function derToPem(der: ArrayBuffer, label: string): string {
  const b64 = bytesToBase64(new Uint8Array(der));
  const lines = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

/* -------------------------------------------------------------------------- */
/*  WebCrypto algorithm parameter builders                                    */
/* -------------------------------------------------------------------------- */

function importParams(alg: JwtAlgorithm): RsaHashedImportParams | EcKeyImportParams | Algorithm {
  const info = ALG_INFO[alg];
  switch (info.family) {
    case 'RSA': return { name: 'RSASSA-PKCS1-v1_5', hash: info.hash! };
    case 'RSA-PSS': return { name: 'RSA-PSS', hash: info.hash! };
    case 'EC': return { name: 'ECDSA', namedCurve: info.namedCurve! };
    case 'EdDSA': return { name: 'Ed25519' };
    default: throw new Error(`${alg} does not use asymmetric keys`);
  }
}

function signParams(alg: JwtAlgorithm): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
  const info = ALG_INFO[alg];
  switch (info.family) {
    case 'RSA': return { name: 'RSASSA-PKCS1-v1_5' };
    case 'RSA-PSS': {
      const saltLength = info.hash === 'SHA-256' ? 32 : info.hash === 'SHA-384' ? 48 : 64;
      return { name: 'RSA-PSS', saltLength };
    }
    case 'EC': return { name: 'ECDSA', hash: info.hash! };
    case 'EdDSA': return { name: 'Ed25519' };
    default: throw new Error(`${alg} does not use asymmetric keys`);
  }
}

function genParams(alg: JwtAlgorithm): RsaHashedKeyGenParams | EcKeyGenParams | Algorithm {
  const info = ALG_INFO[alg];
  const publicExponent = new Uint8Array([1, 0, 1]);
  switch (info.family) {
    case 'RSA': return { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent, hash: info.hash! };
    case 'RSA-PSS': return { name: 'RSA-PSS', modulusLength: 2048, publicExponent, hash: info.hash! };
    case 'EC': return { name: 'ECDSA', namedCurve: info.namedCurve! };
    case 'EdDSA': return { name: 'Ed25519' };
    default: throw new Error(`${alg} has no key pair to generate`);
  }
}

// Import a PEM or JWK string as a WebCrypto key for the given usage.
async function importKeyFlexible(
  key: string,
  alg: JwtAlgorithm,
  usage: 'sign' | 'verify'
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const trimmed = key.trim();
  if (!trimmed) {
    throw new Error(usage === 'sign' ? 'A private key is required to sign' : 'A public key is required to verify');
  }
  const params = importParams(alg);
  if (trimmed.startsWith('{')) {
    let jwk: JsonWebKey;
    try {
      jwk = JSON.parse(trimmed);
    } catch (_e) {
      throw new Error('Key looks like JWK but is not valid JSON');
    }
    return subtle.importKey('jwk', jwk, params, true, [usage]);
  }
  const format = /BEGIN [^-]*PRIVATE KEY/.test(trimmed) ? 'pkcs8' : 'spki';
  return subtle.importKey(format, pemToDer(trimmed), params, true, [usage]);
}

/* -------------------------------------------------------------------------- */
/*  Public async API: sign / verify / generate                               */
/* -------------------------------------------------------------------------- */

// Sign a JWT with any supported algorithm. `key` is the HMAC secret for HS*, or a
// PEM/JWK private key for the asymmetric families.
export async function signJwt(
  headerJson: string,
  payloadJson: string,
  key: string,
  algorithm: JwtAlgorithm
): Promise<string> {
  const family = ALG_INFO[algorithm].family;
  if (family === 'HMAC' || family === 'none') {
    return buildJwt(headerJson, payloadJson, key, algorithm);
  }

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(headerJson);
  } catch (_e) {
    throw new Error('Header JSON is invalid');
  }
  try {
    payload = JSON.parse(payloadJson);
  } catch (_e) {
    throw new Error('Payload JSON is invalid');
  }

  const signingInput = `${base64urlEncodeString(JSON.stringify(header))}.${base64urlEncodeString(JSON.stringify(payload))}`;
  const cryptoKey = await importKeyFlexible(key, algorithm, 'sign');
  const sig = await getSubtle().sign(signParams(algorithm), cryptoKey, new TextEncoder().encode(signingInput));
  return `${signingInput}.${bytesToBase64url(new Uint8Array(sig))}`;
}

// Verify a JWT. `key` is the HMAC secret for HS*, or a PEM/JWK public key otherwise.
export async function verifyJwt(token: string, key: string, algorithm: JwtAlgorithm): Promise<boolean> {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  const family = ALG_INFO[algorithm].family;
  if (family === 'none') return parts[2] === '';
  if (family === 'HMAC') return verifySignature(token, key);

  try {
    const cryptoKey = await importKeyFlexible(key, algorithm, 'verify');
    return await getSubtle().verify(
      signParams(algorithm),
      cryptoKey,
      base64urlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
  } catch (_e) {
    return false;
  }
}

export type GeneratedKeyPair = { privateKey: string; publicKey: string };

// Generate a fresh PEM key pair appropriate for the algorithm's family/curve.
export async function generateKeyPair(algorithm: JwtAlgorithm): Promise<GeneratedKeyPair> {
  if (!isAsymmetric(algorithm)) {
    throw new Error(`${algorithm} does not use a key pair`);
  }
  const subtle = getSubtle();
  const pair = (await subtle.generateKey(genParams(algorithm), true, ['sign', 'verify'])) as CryptoKeyPair;
  const priv = await subtle.exportKey('pkcs8', pair.privateKey);
  const pub = await subtle.exportKey('spki', pair.publicKey);
  return {
    privateKey: derToPem(priv, 'PRIVATE KEY'),
    publicKey: derToPem(pub, 'PUBLIC KEY'),
  };
}
