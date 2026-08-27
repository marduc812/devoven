// ─── FNV Hash (FNV-1 and FNV-1a) ────────────────────────────────────────────
// 32-bit: offset basis = 2166136261, prime = 16777619
// 64-bit: uses split high/low 32-bit approach (no BigInt)
// Pure TypeScript, no external libs.

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

// ─── 32-bit FNV ──────────────────────────────────────────────────────────────

const FNV32_OFFSET_BASIS = 2166136261;
const FNV32_PRIME = 16777619;

export function fnv1_32(input: string): number {
  const bytes = stringToBytes(input);
  let hash = FNV32_OFFSET_BASIS >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = Math.imul(hash, FNV32_PRIME) >>> 0;
    hash ^= bytes[i];
    hash = hash >>> 0;
  }
  return hash;
}

export function fnv1a_32(input: string): number {
  const bytes = stringToBytes(input);
  let hash = FNV32_OFFSET_BASIS >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, FNV32_PRIME) >>> 0;
  }
  return hash;
}

// ─── 64-bit FNV using split high/low 32-bit arithmetic ───────────────────────
// We represent a 64-bit number as { hi: number, lo: number } (each 32-bit unsigned)
// FNV64 offset basis = 14695981039346656037 = 0xCBF29CE484222325
// FNV64 prime        = 1099511628211         = 0x00000100000001B3

interface U64 { hi: number; lo: number; }

// Multiply two U64 values mod 2^64
// We use 32-bit limbs: a = a_hi * 2^32 + a_lo, b = b_hi * 2^32 + b_lo
// Only need lower 64 bits: result_lo = a_lo * b_lo (mod 2^32)
//                          result_hi = (a_hi * b_lo + a_lo * b_hi + upper(a_lo * b_lo)) & 0xFFFFFFFF
function u64Mul(a: U64, b: U64): U64 {
  const a_lo = a.lo >>> 0;
  const a_hi = a.hi >>> 0;
  const b_lo = b.lo >>> 0;
  const b_hi = b.hi >>> 0;

  // Split each 32-bit value into 16-bit halves to avoid overflow
  const a0 = a_lo & 0xffff;
  const a1 = (a_lo >>> 16) & 0xffff;
  const b0 = b_lo & 0xffff;
  const b1 = (b_lo >>> 16) & 0xffff;

  const p00 = Math.imul(a0, b0) >>> 0;
  const p01 = Math.imul(a0, b1) >>> 0;
  const p10 = Math.imul(a1, b0) >>> 0;
  const p11 = Math.imul(a1, b1) >>> 0;

  const lo_mid = ((p00 >>> 16) + (p01 & 0xffff) + (p10 & 0xffff)) >>> 0;
  const result_lo = ((p00 & 0xffff) | ((lo_mid & 0xffff) << 16)) >>> 0;

  const hi_mid = ((lo_mid >>> 16) + (p01 >>> 16) + (p10 >>> 16) + p11) >>> 0;
  const result_hi = (hi_mid + Math.imul(a_hi, b_lo) + Math.imul(a_lo, b_hi)) >>> 0;

  return { hi: result_hi >>> 0, lo: result_lo >>> 0 };
}

function u64Xor(a: U64, byte_val: number): U64 {
  return { hi: a.hi >>> 0, lo: (a.lo ^ byte_val) >>> 0 };
}

// FNV64 offset basis: 0xCBF29CE484222325
// hi = 0xCBF29CE4, lo = 0x84222325
const FNV64_OFFSET: U64 = { hi: 0xCBF29CE4, lo: 0x84222325 };

// FNV64 prime: 0x00000100000001B3
// hi = 0x00000100, lo = 0x000001B3
const FNV64_PRIME: U64 = { hi: 0x00000100, lo: 0x000001B3 };

export function fnv1_64(input: string): U64 {
  const bytes = stringToBytes(input);
  let hash: U64 = { hi: FNV64_OFFSET.hi >>> 0, lo: FNV64_OFFSET.lo >>> 0 };
  for (let i = 0; i < bytes.length; i++) {
    hash = u64Mul(hash, FNV64_PRIME);
    hash = u64Xor(hash, bytes[i]);
  }
  return hash;
}

export function fnv1a_64(input: string): U64 {
  const bytes = stringToBytes(input);
  let hash: U64 = { hi: FNV64_OFFSET.hi >>> 0, lo: FNV64_OFFSET.lo >>> 0 };
  for (let i = 0; i < bytes.length; i++) {
    hash = u64Xor(hash, bytes[i]);
    hash = u64Mul(hash, FNV64_PRIME);
  }
  return hash;
}

function u64ToHex(v: U64): string {
  return v.hi.toString(16).toUpperCase().padStart(8, '0') +
    v.lo.toString(16).toUpperCase().padStart(8, '0');
}

function u64ToDecimal(v: U64): string {
  // Convert hi * 2^32 + lo to decimal string using string arithmetic
  // hi * 4294967296 + lo
  const hiStr = multiplyDecimalString(v.hi.toString(), 4294967296);
  return addDecimalStrings(hiStr, v.lo.toString());
}

function multiplyDecimalString(num: string, multiplier: number): string {
  let carry = 0;
  const digits = num.split('').map(Number).reverse();
  const result: number[] = [];

  // multiplier can be large, so we process digit by digit
  const mulStr = multiplier.toString();
  // Simple long multiplication
  const mulDigits = mulStr.split('').map(Number).reverse();
  const acc = new Array(digits.length + mulDigits.length).fill(0);

  for (let i = 0; i < digits.length; i++) {
    for (let j = 0; j < mulDigits.length; j++) {
      acc[i + j] += digits[i] * mulDigits[j];
    }
  }

  carry = 0;
  for (let i = 0; i < acc.length; i++) {
    acc[i] += carry;
    carry = Math.floor(acc[i] / 10);
    acc[i] %= 10;
  }

  // Remove trailing zeros (which are leading zeros when reversed)
  let last = acc.length - 1;
  while (last > 0 && acc[last] === 0) last--;

  return acc.slice(0, last + 1).reverse().join('') || '0';
}

function addDecimalStrings(a: string, b: string): string {
  const da = a.split('').map(Number).reverse();
  const db = b.split('').map(Number).reverse();
  const len = Math.max(da.length, db.length);
  let carry = 0;
  const result: number[] = [];
  for (let i = 0; i < len; i++) {
    const acc = (da[i] || 0) + (db[i] || 0) + carry;
    result.push(acc % 10);
    carry = Math.floor(acc / 10);
  }
  if (carry) result.push(carry);
  return result.reverse().join('') || '0';
}

export interface FnvResult {
  fnv1_32: { hex: string; decimal: string };
  fnv1a_32: { hex: string; decimal: string };
  fnv1_64: { hex: string; decimal: string };
  fnv1a_64: { hex: string; decimal: string };
}

export function computeFnvAll(input: string): FnvResult {
  const h1_32 = fnv1_32(input);
  const h1a_32 = fnv1a_32(input);
  const h1_64 = fnv1_64(input);
  const h1a_64 = fnv1a_64(input);

  return {
    fnv1_32: {
      hex: h1_32.toString(16).toUpperCase().padStart(8, '0'),
      decimal: h1_32.toString(10),
    },
    fnv1a_32: {
      hex: h1a_32.toString(16).toUpperCase().padStart(8, '0'),
      decimal: h1a_32.toString(10),
    },
    fnv1_64: {
      hex: u64ToHex(h1_64),
      decimal: u64ToDecimal(h1_64),
    },
    fnv1a_64: {
      hex: u64ToHex(h1a_64),
      decimal: u64ToDecimal(h1a_64),
    },
  };
}

export function formatFnvResult(result: FnvResult): string {
  const lines = [
    '=== FNV-1 (32-bit) ===',
    'Hex:     0x' + result.fnv1_32.hex,
    'Decimal: ' + result.fnv1_32.decimal,
    '',
    '=== FNV-1a (32-bit) ===',
    'Hex:     0x' + result.fnv1a_32.hex,
    'Decimal: ' + result.fnv1a_32.decimal,
    '',
    '=== FNV-1 (64-bit) ===',
    'Hex:     0x' + result.fnv1_64.hex,
    'Decimal: ' + result.fnv1_64.decimal,
    '',
    '=== FNV-1a (64-bit) ===',
    'Hex:     0x' + result.fnv1a_64.hex,
    'Decimal: ' + result.fnv1a_64.decimal,
    '',
    'FNV-1a XORs the byte before multiplying (better avalanche effect).',
    'FNV vs other non-cryptographic hashes:',
    '  • FNV: Simple, fast, good distribution. Use for hash tables, checksums.',
    '  • MurmurHash: Better avalanche, designed for hash tables.',
    '  • CRC32: Error-detection oriented.',
    '  • NOT suitable for cryptographic or security-sensitive uses.',
  ];
  return lines.join('\n');
}
