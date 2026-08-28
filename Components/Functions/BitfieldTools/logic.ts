export type BitWidth = 8 | 16 | 32 | 64;

// The project targets ES2015, where BigInt *literals* (0n, 1n) are a syntax
// error even though the BigInt runtime is available — so use BigInt() instead.
const ONE = BigInt(1);
const BYTE_MASK = BigInt(0xff);

export const BIT_WIDTHS: BitWidth[] = [8, 16, 32, 64];

export type ByteBreakdown = {
  index: number; // 0 = least significant byte
  highBit: number;
  lowBit: number;
  bits: number[]; // MSB first, always 8 entries
  value: number;
  hex: string;
  char: string;
};

export type BitfieldResult = {
  value: bigint;
  width: BitWidth;
  bits: number[]; // MSB first, length === width
  dec: string;
  signedDec: string;
  hex: string;
  oct: string;
  bin: string;
  bytes: ByteBreakdown[]; // most significant byte first
  setBits: number;
  clearBits: number;
  setPositions: number[]; // descending
  highestSetBit: number; // -1 when the value is zero
  lowestSetBit: number; // -1 when the value is zero
  wrapped: boolean; // input did not fit the selected width
};

export const PARSE_ERROR =
  'Enter a decimal, hex (0xFF), binary (0b1010) or octal (0o377) number';

export function maskFor(width: BitWidth): bigint {
  return (ONE << BigInt(width)) - ONE;
}

/** Parses decimal / 0x / 0b / 0o input (optionally negative) and wraps it to `width` bits. */
export function parseBitfieldInput(
  input: string,
  width: BitWidth = 32
): { value: bigint; wrapped: boolean } {
  const raw = input.trim().replace(/[_\s]/g, '');
  if (!raw) throw new Error(PARSE_ERROR);

  const negative = raw.startsWith('-');
  const body = negative ? raw.slice(1) : raw;
  const valid =
    /^0[xX][0-9a-fA-F]+$/.test(body) ||
    /^0[bB][01]+$/.test(body) ||
    /^0[oO][0-7]+$/.test(body) ||
    /^[0-9]+$/.test(body);
  if (!valid) throw new Error(PARSE_ERROR);

  const magnitude = BigInt(body);
  const signed = negative ? -magnitude : magnitude;
  const mask = maskFor(width);
  // BigInt bitwise ops use two's complement, so this also handles negatives.
  const value = signed & mask;

  return { value, wrapped: value !== signed };
}

function printableChar(byte: number): string {
  if (byte >= 0x20 && byte < 0x7f) return String.fromCharCode(byte);
  const names: Record<number, string> = {
    0x00: 'NUL',
    0x07: 'BEL',
    0x08: 'BS',
    0x09: 'HT',
    0x0a: 'LF',
    0x0b: 'VT',
    0x0c: 'FF',
    0x0d: 'CR',
    0x1b: 'ESC',
    0x7f: 'DEL',
  };
  return names[byte] || '·';
}

export function analyzeBitfield(
  value: bigint,
  width: BitWidth = 32,
  wrapped = false
): BitfieldResult {
  const masked = value & maskFor(width);

  const bits: number[] = [];
  for (let i = width - 1; i >= 0; i--) {
    bits.push(Number((masked >> BigInt(i)) & ONE));
  }

  const bytes: ByteBreakdown[] = [];
  for (let b = width / 8 - 1; b >= 0; b--) {
    const byteValue = Number((masked >> BigInt(b * 8)) & BYTE_MASK);
    bytes.push({
      index: b,
      highBit: b * 8 + 7,
      lowBit: b * 8,
      bits: bits.slice(width - (b + 1) * 8, width - b * 8),
      value: byteValue,
      hex: byteValue.toString(16).toUpperCase().padStart(2, '0'),
      char: printableChar(byteValue),
    });
  }

  const setPositions: number[] = [];
  for (let i = width - 1; i >= 0; i--) {
    if (((masked >> BigInt(i)) & ONE) === ONE) setPositions.push(i);
  }

  const isNegative = bits[0] === 1;
  const signed = isNegative ? masked - (ONE << BigInt(width)) : masked;

  return {
    value: masked,
    width,
    bits,
    dec: masked.toString(10),
    signedDec: signed.toString(10),
    hex: `0x${masked.toString(16).toUpperCase().padStart(width / 4, '0')}`,
    oct: `0o${masked.toString(8)}`,
    bin: masked.toString(2).padStart(width, '0'),
    bytes,
    setBits: setPositions.length,
    clearBits: width - setPositions.length,
    setPositions,
    highestSetBit: setPositions.length ? setPositions[0] : -1,
    lowestSetBit: setPositions.length ? setPositions[setPositions.length - 1] : -1,
    wrapped,
  };
}

/** Convenience wrapper: parse raw user input straight into a result. */
export function bitfieldFromInput(input: string, width: BitWidth = 32): BitfieldResult {
  const { value, wrapped } = parseBitfieldInput(input, width);
  return analyzeBitfield(value, width, wrapped);
}

export function toggleBit(value: bigint, position: number, width: BitWidth): bigint {
  return (value ^ (ONE << BigInt(position))) & maskFor(width);
}

export function positionError(width: BitWidth): string {
  return `Enter bit positions between 0 and ${width - 1}, separated by commas`;
}

/**
 * Parses a comma/space separated list of bit positions ("0, 3 7") into unique
 * positions. Mirrors the format of the `setPositions` readout so it round-trips.
 */
export function parseBitPositions(input: string, width: BitWidth): number[] {
  const parts = input.trim().split(/[,\s]+/).filter(Boolean);
  if (!parts.length) throw new Error(positionError(width));

  const seen = new Set<number>();
  for (const part of parts) {
    if (!/^[0-9]+$/.test(part)) throw new Error(positionError(width));
    const position = Number(part);
    if (position >= width) throw new Error(positionError(width));
    seen.add(position);
  }
  return Array.from(seen);
}

export function setBitsAt(value: bigint, positions: number[], width: BitWidth): bigint {
  return positions.reduce((acc, p) => acc | (ONE << BigInt(p)), value) & maskFor(width);
}

export function clearBitsAt(value: bigint, positions: number[], width: BitWidth): bigint {
  return positions.reduce((acc, p) => acc & ~(ONE << BigInt(p)), value) & maskFor(width);
}

export function toggleBitsAt(value: bigint, positions: number[], width: BitWidth): bigint {
  return positions.reduce((acc, p) => toggleBit(acc, p, width), value);
}

export function numberToBits(n: number, bits = 32): string[] {
  const unsigned = n >>> 0; // Convert to unsigned 32-bit
  return Array.from({ length: bits }, (_, i) => ((unsigned >> (bits - 1 - i)) & 1).toString());
}
