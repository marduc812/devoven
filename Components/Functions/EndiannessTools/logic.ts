export type BitWidth = 16 | 32 | 64;

export interface EndiannessResult {
  inputHex: string;
  bigEndianHex: string;
  littleEndianHex: string;
  bytes: string[];
  bytesBigEndian: string[];
  bytesLittleEndian: string[];
  bitWidth: BitWidth;
  /** Unsigned value of the big-endian reading. */
  decimal: string;
  /** Two's-complement value of the big-endian reading. */
  decimalSigned: string;
  /** Unsigned value the same bytes would have if read little-endian. */
  decimalSwapped: string;
  /** Big-endian value in binary, zero padded to the bit width. */
  binary: string;
  error?: string;
}

function normalizeHex(input: string): string {
  // Remove 0x prefix, spaces, underscores
  let h = input.replace(/^0x/i, '').replace(/[\s_]/g, '').toUpperCase();
  // Only allow hex characters
  if (!/^[0-9A-F]*$/.test(h)) return '';
  return h;
}

function padToWidth(hex: string, bits: BitWidth): string | null {
  const nibbles = bits / 4;
  if (hex.length > nibbles) return null; // too long
  return hex.padStart(nibbles, '0');
}

function splitBytes(hex: string): string[] {
  const bytes: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(hex.slice(i, i + 2));
  }
  return bytes;
}

/** Exact for all widths — a 64-bit value has more range than a JS number. */
function hexToDecimal(hex: string): string {
  if (!hex) return '0';
  return BigInt('0x' + hex).toString();
}

/** Reinterpret an unsigned value as two's complement at the given width. */
function toSigned(hex: string, bits: BitWidth): string {
  if (!hex) return '0';
  const unsigned = BigInt('0x' + hex);
  // The project targets ES2015, where BigInt literals (1n) are a syntax error.
  const span = BigInt(1) << BigInt(bits);
  const half = span >> BigInt(1);
  return (unsigned >= half ? unsigned - span : unsigned).toString();
}

export function convertEndianness(input: string, bitWidth: BitWidth): EndiannessResult {
  const fail = (error: string): EndiannessResult => ({
    inputHex: input,
    bigEndianHex: '',
    littleEndianHex: '',
    bytes: [],
    bytesBigEndian: [],
    bytesLittleEndian: [],
    bitWidth,
    decimal: '',
    decimalSigned: '',
    decimalSwapped: '',
    binary: '',
    error,
  });

  const normalized = normalizeHex(input);
  if (!normalized) {
    return fail('Invalid hex input. Enter a hex value like 12345678 or 0xDEADBEEF.');
  }

  const padded = padToWidth(normalized, bitWidth);
  if (padded === null) {
    return fail(`Value too large for ${bitWidth}-bit width. Max ${bitWidth / 4} hex digits.`);
  }

  const bytesBE = splitBytes(padded);
  const bytesLE = [...bytesBE].reverse();

  const bigEndianHex = bytesBE.join('');
  const littleEndianHex = bytesLE.join('');

  return {
    inputHex: padded,
    bigEndianHex,
    littleEndianHex,
    bytes: bytesBE,
    bytesBigEndian: bytesBE,
    bytesLittleEndian: bytesLE,
    bitWidth,
    decimal: hexToDecimal(bigEndianHex),
    decimalSigned: toSigned(bigEndianHex, bitWidth),
    decimalSwapped: hexToDecimal(littleEndianHex),
    binary: BigInt('0x' + bigEndianHex).toString(2).padStart(bitWidth, '0'),
    error: undefined,
  };
}

/** The character a byte stands for in a hex dump, or '.' when it is not printable. */
export function byteAscii(byte: string): string {
  const code = parseInt(byte, 16);
  return code >= 32 && code < 127 ? String.fromCharCode(code) : '.';
}
