// ─── Base62 Encoder / Decoder ─────────────────────────────────────────────────
// Alphabet: 0-9A-Za-z (62 characters)
// Common for URL shorteners and compact IDs.
// String → Base62 treats the string as raw bytes (Latin-1).
// Number → Base62 encodes a non-negative integer string.
// No BigInt — uses string-based (byte-array) arithmetic.

export const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

function bytesToString(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

// Divide a big-endian byte array by divisor; modifies array in place; returns remainder
function divideByteArray(bytes: number[], divisor: number): number {
  let remainder = 0;
  for (let i = 0; i < bytes.length; i++) {
    const acc = remainder * 256 + bytes[i];
    bytes[i] = Math.floor(acc / divisor);
    remainder = acc % divisor;
  }
  return remainder;
}

// Multiply byte array by multiplier and add carry (in-place)
function multiplyByteArray(bytes: number[], multiplier: number, addend: number): void {
  let carry = addend;
  for (let i = bytes.length - 1; i >= 0; i--) {
    const acc = bytes[i] * multiplier + carry;
    bytes[i] = acc & 0xff;
    carry = Math.floor(acc / 256);
  }
}

// ─── Text ↔ Base62 ────────────────────────────────────────────────────────────

export function base62EncodeText(input: string): string {
  if (!input) return '';

  const bytes = stringToBytes(input);

  // Count leading zero bytes
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  const digits = bytes.slice();
  let result = '';

  while (digits.some((b) => b !== 0)) {
    const remainder = divideByteArray(digits, 62);
    result = BASE62_ALPHABET[remainder] + result;
  }

  result = BASE62_ALPHABET[0].repeat(leadingZeros) + result;
  return result;
}

export function base62DecodeText(input: string): string {
  if (!input.trim()) return '';

  const str = input.trim();

  // Validate characters
  for (let i = 0; i < str.length; i++) {
    if (BASE62_ALPHABET.indexOf(str[i]) === -1) {
      throw new Error('Invalid Base62 character: ' + str[i]);
    }
  }

  // Count leading '0's (first char of alphabet)
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === BASE62_ALPHABET[0]; i++) {
    leadingZeros++;
  }

  const size = Math.ceil(str.length * 1.3) + 1; // log(62)/log(256) ≈ 0.7657, inverse ≈ 1.306
  const bytes = new Array(size).fill(0);

  for (let i = 0; i < str.length; i++) {
    const charIdx = BASE62_ALPHABET.indexOf(str[i]);
    multiplyByteArray(bytes, 62, charIdx);
  }

  // Remove leading zero bytes from result
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) {
    start++;
  }

  const resultBytes = new Array(leadingZeros).fill(0).concat(bytes.slice(start));
  return bytesToString(resultBytes);
}

// ─── Number ↔ Base62 ─────────────────────────────────────────────────────────

// Encode a non-negative integer (as decimal string) to Base62
export function base62EncodeNumber(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (!/^[0-9]+$/.test(trimmed)) throw new Error('Input must be a non-negative integer');

  if (trimmed === '0') return '0';

  // Treat the number as an array of decimal digits and divide by 62 repeatedly
  // We work with the decimal string directly using string division
  let digits = trimmed.split('').map(Number);
  let result = '';

  while (digits.length > 0 && !(digits.length === 1 && digits[0] === 0)) {
    // Divide by 62
    let remainder = 0;
    const quotientDigits: number[] = [];
    for (let i = 0; i < digits.length; i++) {
      const acc = remainder * 10 + digits[i];
      const q = Math.floor(acc / 62);
      remainder = acc % 62;
      if (quotientDigits.length > 0 || q > 0) {
        quotientDigits.push(q);
      }
    }
    result = BASE62_ALPHABET[remainder] + result;
    digits = quotientDigits;
  }

  return result || '0';
}

// Decode a Base62 string to a decimal integer string
export function base62DecodeNumber(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  for (let i = 0; i < trimmed.length; i++) {
    if (BASE62_ALPHABET.indexOf(trimmed[i]) === -1) {
      throw new Error('Invalid Base62 character: ' + trimmed[i]);
    }
  }

  // Multiply current decimal result by 62, then add next digit value
  // We work in decimal string arithmetic
  let result = '0';

  for (let i = 0; i < trimmed.length; i++) {
    const digitValue = BASE62_ALPHABET.indexOf(trimmed[i]);
    // result = result * 62 + digitValue
    result = addDecimalStrings(multiplyDecimalString(result, 62), digitValue.toString());
  }

  return result;
}

// Multiply a decimal string by an integer
function multiplyDecimalString(num: string, multiplier: number): string {
  let carry = 0;
  const digits = num.split('').map(Number).reverse();
  const result: number[] = [];
  for (let i = 0; i < digits.length; i++) {
    const acc = digits[i] * multiplier + carry;
    result.push(acc % 10);
    carry = Math.floor(acc / 10);
  }
  while (carry > 0) {
    result.push(carry % 10);
    carry = Math.floor(carry / 10);
  }
  return result.reverse().join('') || '0';
}

// Add two decimal strings
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

export function isLikelyBase62Encoded(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // If it's all decimal digits, it's likely a plain number; otherwise check for alpha chars
  let hasAlpha = false;
  for (let i = 0; i < trimmed.length; i++) {
    if (BASE62_ALPHABET.indexOf(trimmed[i]) === -1) return false;
    if (/[A-Za-z]/.test(trimmed[i])) hasAlpha = true;
  }
  return hasAlpha; // only flag as encoded if it contains alpha chars
}
