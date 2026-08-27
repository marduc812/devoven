// Ethereum Address Checksum (EIP-55) — pure logic, no browser APIs

// Keccak-256 implementation (needed for EIP-55)
// Using the Keccak sponge construction

const KECCAK_RC: number[][] = [
  [0x00000001, 0x00000000], [0x00008082, 0x00000000],
  [0x0000808a, 0x80000000], [0x80008000, 0x80000000],
  [0x0000808b, 0x00000000], [0x80000001, 0x00000000],
  [0x80008081, 0x80000000], [0x00008009, 0x80000000],
  [0x0000008a, 0x00000000], [0x00000088, 0x00000000],
  [0x80008009, 0x00000000], [0x8000000a, 0x00000000],
  [0x8000808b, 0x00000000], [0x0000008b, 0x80000000],
  [0x00008089, 0x80000000], [0x00008003, 0x80000000],
  [0x00008002, 0x80000000], [0x00000080, 0x80000000],
  [0x0000800a, 0x00000000], [0x8000000a, 0x80000000],
  [0x80008081, 0x80000000], [0x00008080, 0x80000000],
  [0x80000001, 0x00000000], [0x80008008, 0x80000000],
];

const KECCAK_RHO: number[] = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14,
  27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

const KECCAK_PI: number[] = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4,
  15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

function rotl32(v: number, n: number): number {
  return ((v << n) | (v >>> (32 - n))) >>> 0;
}

// We represent each 64-bit lane as [lo, hi] (little-endian 32-bit halves)
type Lane = [number, number];

function rotl64(lo: number, hi: number, n: number): Lane {
  if (n === 0) return [lo, hi];
  if (n < 32) {
    return [
      ((lo << n) | (hi >>> (32 - n))) >>> 0,
      ((hi << n) | (lo >>> (32 - n))) >>> 0,
    ];
  }
  n -= 32;
  return [
    ((hi << n) | (lo >>> (32 - n))) >>> 0,
    ((lo << n) | (hi >>> (32 - n))) >>> 0,
  ];
}

function keccakF(state: number[]): void {
  // state is 50 uint32 values (25 lanes x 2 halves)
  for (let r = 0; r < 24; r++) {
    // Theta
    const C: Lane[] = [];
    for (let x = 0; x < 5; x++) {
      C[x] = [
        state[x * 2] ^ state[(x + 5) * 2] ^ state[(x + 10) * 2] ^ state[(x + 15) * 2] ^ state[(x + 20) * 2],
        state[x * 2 + 1] ^ state[(x + 5) * 2 + 1] ^ state[(x + 10) * 2 + 1] ^ state[(x + 15) * 2 + 1] ^ state[(x + 20) * 2 + 1],
      ];
    }
    for (let x = 0; x < 5; x++) {
      const [dlo, dhi] = rotl64(C[(x + 1) % 5][0], C[(x + 1) % 5][1], 1);
      const dl = dlo ^ C[(x + 4) % 5][0];
      const dh = dhi ^ C[(x + 4) % 5][1];
      for (let y = 0; y < 5; y++) {
        state[(y * 5 + x) * 2] ^= dl;
        state[(y * 5 + x) * 2 + 1] ^= dh;
      }
    }

    // Rho + Pi
    const B: number[] = new Array(50).fill(0);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const idx = y * 5 + x;
        const rho = idx === 0 ? 0 : KECCAK_RHO[idx - 1];
        const [lo, hi] = rotl64(state[idx * 2], state[idx * 2 + 1], rho % 64);
        const pi = KECCAK_PI[idx] !== undefined && idx !== 0 ? KECCAK_PI[idx - 1] : idx;
        void pi;
        // Pi permutation: B[PI[idx]] = rotl(A[idx], rho)
        const newX = y;
        const newY = (2 * x + 3 * y) % 5;
        B[(newX * 5 + newY) * 2] = lo;
        B[(newX * 5 + newY) * 2 + 1] = hi;
      }
    }

    // Chi
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const idx = (y * 5 + x) * 2;
        state[idx] = B[idx] ^ ((~B[((y * 5 + (x + 1) % 5)) * 2]) & B[((y * 5 + (x + 2) % 5)) * 2]);
        state[idx + 1] = B[idx + 1] ^ ((~B[((y * 5 + (x + 1) % 5)) * 2 + 1]) & B[((y * 5 + (x + 2) % 5)) * 2 + 1]);
      }
    }

    // Iota
    state[0] ^= KECCAK_RC[r][0];
    state[1] ^= KECCAK_RC[r][1];
  }
}

export function keccak256(input: Uint8Array): Uint8Array {
  const rate = 136; // 1088 bits / 8 for keccak-256
  const state = new Array<number>(50).fill(0);

  // Absorb
  let offset = 0;
  while (offset + rate <= input.length) {
    for (let i = 0; i < rate; i += 4) {
      const lo = (input[offset + i] | (input[offset + i + 1] << 8) | (input[offset + i + 2] << 16) | (input[offset + i + 3] << 24)) >>> 0;
      const laneIdx = Math.floor(i / 8);
      if (i % 8 === 0) state[laneIdx * 2] ^= lo;
      else state[laneIdx * 2 + 1] ^= lo;
    }
    keccakF(state);
    offset += rate;
  }

  // Pad
  const padded = new Uint8Array(rate);
  const remaining = input.length - offset;
  for (let i = 0; i < remaining; i++) padded[i] = input[offset + i];
  padded[remaining] = 0x01; // Keccak padding (not SHA3's 0x06)
  padded[rate - 1] |= 0x80;

  for (let i = 0; i < rate; i += 4) {
    const lo = (padded[i] | (padded[i + 1] << 8) | (padded[i + 2] << 16) | (padded[i + 3] << 24)) >>> 0;
    const laneIdx = Math.floor(i / 8);
    if (i % 8 === 0) state[laneIdx * 2] ^= lo;
    else state[laneIdx * 2 + 1] ^= lo;
  }
  keccakF(state);

  // Squeeze: extract 32 bytes
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const laneIdx = Math.floor(i / 4);
    const byteIdx = i % 4;
    if (i % 8 < 4) {
      result[i] = (state[laneIdx * 2] >>> (byteIdx * 8)) & 0xff;
    } else {
      result[i] = (state[laneIdx * 2 + 1] >>> (byteIdx * 8)) & 0xff;
    }
  }
  return result;
}

function strToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export type EthChecksumResult = {
  valid: boolean;
  checksummed?: string;
  isAlreadyChecksummed?: boolean;
  isAllLower?: boolean;
  isAllUpper?: boolean;
  error?: string;
};

export function toEIP55Checksum(address: string): EthChecksumResult {
  let addr = address.trim();
  if (!addr) return { valid: false, error: 'Empty input' };

  if (addr.startsWith('0x') || addr.startsWith('0X')) addr = addr.slice(2);

  if (!/^[0-9a-fA-F]{40}$/.test(addr)) {
    return { valid: false, error: 'Invalid Ethereum address: must be 40 hex characters (optionally prefixed with 0x)' };
  }

  const lower = addr.toLowerCase();
  const hashBytes = keccak256(strToBytes(lower));
  const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  let checksummed = '0x';
  for (let i = 0; i < 40; i++) {
    const c = lower[i];
    if (c >= 'a' && c <= 'f') {
      const nibble = parseInt(hashHex[i], 16);
      checksummed += nibble >= 8 ? c.toUpperCase() : c;
    } else {
      checksummed += c;
    }
  }

  const inputChecksummed = '0x' + addr;
  const isAlreadyChecksummed = inputChecksummed === checksummed;
  const isAllLower = addr === lower;
  const isAllUpper = addr === addr.toUpperCase();

  return {
    valid: true,
    checksummed,
    isAlreadyChecksummed,
    isAllLower,
    isAllUpper,
  };
}

export function formatEthChecksumResult(result: EthChecksumResult): string {
  if (!result.valid) return `Error: ${result.error}`;
  if (!result.checksummed) return 'Error';

  const lines: string[] = [
    `EIP-55 Checksummed: ${result.checksummed}`,
    ``,
    `Status: ${
      result.isAlreadyChecksummed
        ? 'Already correctly checksummed'
        : result.isAllLower
        ? 'Input was all-lowercase (no checksum)'
        : result.isAllUpper
        ? 'Input was all-uppercase (no checksum)'
        : 'Input had incorrect/mixed case'
    }`,
    ``,
    `EIP-55 Info:`,
    `  Each hex letter is uppercased if the corresponding nibble`,
    `  in keccak256(lowercase address) is >= 8, lowercase otherwise.`,
    `  This embeds a checksum into the address capitalization.`,
  ];
  return lines.join('\n');
}
