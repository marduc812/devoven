// ─── Whirlpool (ISO/IEC 10118-3) ─────────────────────────────────────────────
// No library in the noble ecosystem ships Whirlpool, so this is the algorithm
// straight from the spec. Every table is derived at load time from the two
// 16-entry mini-boxes below rather than pasted in as 8 KB of literals — the
// derivation is the part a reader can actually check against the spec.
//
// The 512-bit state is held as eight (hi, lo) pairs of 32-bit words. BigInt
// would read better but runs roughly an order of magnitude slower, and this
// hashes whatever a user pastes into a textarea.

/** Mini-box E and its inverse, plus mini-box R (spec §7.1). */
const MINI_E = [0x1, 0xb, 0x9, 0xc, 0xd, 0x6, 0xf, 0x3, 0xe, 0x8, 0x7, 0x4, 0xa, 0x2, 0x5, 0x0];
const MINI_R = [0x7, 0xc, 0xb, 0xd, 0xe, 0x4, 0x9, 0xf, 0x6, 0x3, 0x8, 0xa, 0x2, 0x5, 0x1, 0x0];

const ROUNDS = 10;

/** The 8x8 substitution box, built from the mini-boxes. */
const SBOX = (() => {
  const inverseE = new Array<number>(16);
  MINI_E.forEach((value, index) => {
    inverseE[value] = index;
  });

  const sbox = new Uint8Array(256);
  for (let x = 0; x < 256; x++) {
    const upper = MINI_E[x >> 4];
    const lower = inverseE[x & 0x0f];
    const mid = MINI_R[upper ^ lower];
    sbox[x] = (MINI_E[upper ^ mid] << 4) | inverseE[lower ^ mid];
  }
  return sbox;
})();

/** Multiply by x in GF(2^8) modulo the Whirlpool polynomial x^8+x^4+x^3+x^2+1. */
function xtime(value: number): number {
  const shifted = value << 1;
  return (shifted & 0xff) ^ (shifted & 0x100 ? 0x1d : 0);
}

// Circulant table C0 and its seven byte-rotations. The MDS row is
// (1, 1, 4, 1, 8, 5, 2, 9) over GF(2^8).
const CH: Uint32Array[] = [];
const CL: Uint32Array[] = [];
for (let t = 0; t < 8; t++) {
  CH.push(new Uint32Array(256));
  CL.push(new Uint32Array(256));
}

const RCH = new Uint32Array(ROUNDS + 1);
const RCL = new Uint32Array(ROUNDS + 1);

(function buildTables() {
  for (let x = 0; x < 256; x++) {
    const v1 = SBOX[x];
    const v2 = xtime(v1);
    const v4 = xtime(v2);
    const v5 = v4 ^ v1;
    const v8 = xtime(v4);
    const v9 = v8 ^ v1;

    let hi = ((v1 << 24) | (v1 << 16) | (v4 << 8) | v1) >>> 0;
    let lo = ((v8 << 24) | (v5 << 16) | (v2 << 8) | v9) >>> 0;

    for (let t = 0; t < 8; t++) {
      CH[t][x] = hi;
      CL[t][x] = lo;
      // Rotate the 64-bit word right by one byte for the next table.
      const nextHi = (((lo << 24) | (hi >>> 8)) >>> 0);
      const nextLo = (((hi << 24) | (lo >>> 8)) >>> 0);
      hi = nextHi;
      lo = nextLo;
    }
  }

  // Round constants take one row of eight consecutive S-box outputs, each byte
  // read from the table column that already holds it in the right position.
  for (let r = 1; r <= ROUNDS; r++) {
    const base = 8 * (r - 1);
    let hi = 0;
    let lo = 0;
    for (let t = 0; t < 4; t++) hi ^= CH[t][base + t] & (0xff << (24 - 8 * t));
    for (let t = 4; t < 8; t++) lo ^= CL[t][base + t] & (0xff << (24 - 8 * (t - 4)));
    RCH[r] = hi >>> 0;
    RCL[r] = lo >>> 0;
  }
})();

/** Byte `t` (0 = most significant) of the 64-bit word split across hi/lo. */
function byteAt(hi: number, lo: number, t: number): number {
  return t < 4 ? (hi >>> (24 - 8 * t)) & 0xff : (lo >>> (24 - 8 * (t - 4))) & 0xff;
}

/**
 * One application of the round function gamma-pi-theta to eight rows, written
 * into `outHi`/`outLo`. The three spec steps collapse into a single table
 * lookup per input byte, which is the whole point of the circulant tables.
 */
function transform(
  srcHi: Uint32Array,
  srcLo: Uint32Array,
  outHi: Uint32Array,
  outLo: Uint32Array,
): void {
  for (let i = 0; i < 8; i++) {
    let hi = 0;
    let lo = 0;
    for (let t = 0; t < 8; t++) {
      const row = (i - t) & 7;
      const b = byteAt(srcHi[row], srcLo[row], t);
      hi ^= CH[t][b];
      lo ^= CL[t][b];
    }
    outHi[i] = hi >>> 0;
    outLo[i] = lo >>> 0;
  }
}

/** Whirlpool over raw bytes. Returns the 64-byte digest. */
export function whirlpoolBytes(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;

  // Pad to a whole number of 64-byte blocks, leaving 32 bytes for the length
  // field. Whirlpool's length counter is 256 bits wide; only the low 64 can
  // ever be non-zero for anything a browser can hold in memory.
  const padded = new Uint8Array(
    input.length + 1 + ((32 - ((input.length + 1) % 64) + 64) % 64) + 32,
  );
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000) >>> 0, false);
  view.setUint32(padded.length - 4, bitLength >>> 0, false);

  // Running digest, doubling as the key schedule's starting key.
  const hashHi = new Uint32Array(8);
  const hashLo = new Uint32Array(8);

  const blockHi = new Uint32Array(8);
  const blockLo = new Uint32Array(8);
  const keyHi = new Uint32Array(8);
  const keyLo = new Uint32Array(8);
  const stateHi = new Uint32Array(8);
  const stateLo = new Uint32Array(8);
  const tmpHi = new Uint32Array(8);
  const tmpLo = new Uint32Array(8);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 8; i++) {
      blockHi[i] = view.getUint32(offset + i * 8, false);
      blockLo[i] = view.getUint32(offset + i * 8 + 4, false);
      keyHi[i] = hashHi[i];
      keyLo[i] = hashLo[i];
      stateHi[i] = (blockHi[i] ^ keyHi[i]) >>> 0;
      stateLo[i] = (blockLo[i] ^ keyLo[i]) >>> 0;
    }

    for (let r = 1; r <= ROUNDS; r++) {
      // Key schedule: the round constant enters the first row only.
      transform(keyHi, keyLo, tmpHi, tmpLo);
      tmpHi[0] = (tmpHi[0] ^ RCH[r]) >>> 0;
      tmpLo[0] = (tmpLo[0] ^ RCL[r]) >>> 0;
      keyHi.set(tmpHi);
      keyLo.set(tmpLo);

      transform(stateHi, stateLo, tmpHi, tmpLo);
      for (let i = 0; i < 8; i++) {
        stateHi[i] = (tmpHi[i] ^ keyHi[i]) >>> 0;
        stateLo[i] = (tmpLo[i] ^ keyLo[i]) >>> 0;
      }
    }

    // Miyaguchi-Preneel: H = H ^ E_H(block) ^ block.
    for (let i = 0; i < 8; i++) {
      hashHi[i] = (hashHi[i] ^ stateHi[i] ^ blockHi[i]) >>> 0;
      hashLo[i] = (hashLo[i] ^ stateLo[i] ^ blockLo[i]) >>> 0;
    }
  }

  const digest = new Uint8Array(64);
  const out = new DataView(digest.buffer);
  for (let i = 0; i < 8; i++) {
    out.setUint32(i * 8, hashHi[i], false);
    out.setUint32(i * 8 + 4, hashLo[i], false);
  }
  return digest;
}

/** Whirlpool of a UTF-8 encoded string, as lowercase hex. */
export function whirlpool(text: string): string {
  return Array.from(whirlpoolBytes(new TextEncoder().encode(text)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
