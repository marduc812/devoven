const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const MIN_BASE = 2;
export const MAX_BASE = 36;

// The project targets ES2015, where BigInt *literals* (0n, 1n) are a syntax
// error even though the BigInt runtime is available — so use BigInt() instead.
const ZERO = BigInt(0);
const ONE = BigInt(1);

/** base^exponent for bigints; ** is unavailable at this compile target. */
function bigPow(base: bigint, exponent: number): bigint {
  let result = ONE;
  for (let i = 0; i < exponent; i++) result = result * base;
  return result;
}

export function validateBase(base: number): void {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE)
    throw new Error('Base must be an integer between 2 and 36');
}

/** Strip a leading sign and drop separators, returning the bare digits. */
function splitSign(numStr: string): { negative: boolean; digits: string } {
  const s = numStr.trim().replace(/[\s_]/g, '').toUpperCase();
  if (s.startsWith('-')) return { negative: true, digits: s.slice(1) };
  if (s.startsWith('+')) return { negative: false, digits: s.slice(1) };
  return { negative: false, digits: s };
}

/**
 * Convert a number string in sourceBase to base-10.
 *
 * BigInt throughout, so a 64-bit hex value or a 200-digit base-36 string
 * converts exactly instead of drifting once it passes 2^53.
 */
export function toDecimalString(numStr: string, sourceBase: number): string {
  validateBase(sourceBase);
  const { negative, digits } = splitSign(numStr);
  if (!digits) throw new Error('Empty input');

  const base = BigInt(sourceBase);
  let result = ZERO;
  for (const c of digits) {
    const digit = DIGITS.indexOf(c);
    if (digit === -1 || digit >= sourceBase)
      throw new Error('Invalid digit "' + c + '" for base ' + sourceBase);
    result = result * base + BigInt(digit);
  }
  return negative && result !== ZERO ? '-' + result.toString() : result.toString();
}

/** Convert a base-10 integer string to a target base string. */
export function fromDecimalString(decStr: string, targetBase: number): string {
  validateBase(targetBase);

  let n: bigint;
  try {
    n = BigInt(decStr.trim());
  } catch {
    throw new Error('Invalid decimal number: ' + decStr);
  }
  if (n === ZERO) return '0';

  const negative = n < ZERO;
  if (negative) n = -n;

  const base = BigInt(targetBase);
  let result = '';
  while (n > ZERO) {
    result = DIGITS[Number(n % base)] + result;
    n = n / base;
  }

  return negative ? '-' + result : result;
}

export interface BaseConversionResult {
  decimal: string;
  base2: string;
  base8: string;
  base10: string;
  base16: string;
  base32: string;
  base36: string;
}

/** The bases given their own card in the UI, in the order they are shown. */
export const COMMON_BASES: Array<{
  base: number;
  label: string;
  key: keyof BaseConversionResult;
}> = [
  { base: 2, label: 'Binary (base 2)', key: 'base2' },
  { base: 8, label: 'Octal (base 8)', key: 'base8' },
  { base: 10, label: 'Decimal (base 10)', key: 'base10' },
  { base: 16, label: 'Hexadecimal (base 16)', key: 'base16' },
  { base: 32, label: 'Base 32', key: 'base32' },
  { base: 36, label: 'Base 36', key: 'base36' },
];

export function convertBases(numStr: string, sourceBase: number): BaseConversionResult {
  const decimal = toDecimalString(numStr, sourceBase);

  const result: BaseConversionResult = {
    decimal,
    base2: '',
    base8: '',
    base10: '',
    base16: '',
    base32: '',
    base36: '',
  };

  for (const t of COMMON_BASES) {
    result[t.key] = fromDecimalString(decimal, t.base);
  }

  return result;
}

/** Every base from 2 to 36, for the full table. */
export function allBases(decimal: string): Array<{ base: number; value: string }> {
  const rows: Array<{ base: number; value: string }> = [];
  for (let b = MIN_BASE; b <= MAX_BASE; b++) {
    rows.push({ base: b, value: fromDecimalString(decimal, b) });
  }
  return rows;
}

export interface PlaceValue {
  char: string;
  digit: number;
  power: number;
  /** digit × base^power, as a decimal string. */
  contribution: string;
}

/**
 * The arithmetic behind the conversion: what each digit of the input is worth
 * once its position is taken into account.
 */
export function placeValues(numStr: string, sourceBase: number): PlaceValue[] {
  validateBase(sourceBase);
  const { digits } = splitSign(numStr);
  if (!digits) return [];

  const base = BigInt(sourceBase);
  const places: PlaceValue[] = [];
  for (let i = 0; i < digits.length; i++) {
    const char = digits[i];
    const digit = DIGITS.indexOf(char);
    if (digit === -1 || digit >= sourceBase)
      throw new Error('Invalid digit "' + char + '" for base ' + sourceBase);
    const power = digits.length - 1 - i;
    places.push({
      char,
      digit,
      power,
      contribution: (BigInt(digit) * bigPow(base, power)).toString(),
    });
  }
  return places;
}

/** The digit set a base draws from, e.g. base 16 → "0-9, A-F". */
export function digitSet(base: number): string {
  validateBase(base);
  if (base <= 10) return `0-${base - 1}`;
  return `0-9, A-${DIGITS[base - 1]}`;
}

/** Bits needed to hold the value, i.e. the length of its binary form. */
export function bitLength(decimal: string): number {
  const n = BigInt(decimal);
  const abs = n < ZERO ? -n : n;
  return abs === ZERO ? 1 : abs.toString(2).length;
}
