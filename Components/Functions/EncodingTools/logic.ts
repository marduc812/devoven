// All functions in this file are pure (no React, no browser APIs).
// They take strings (and optional numbers) and return strings,
// throwing descriptive errors on bad input.

// ─── Base32 ──────────────────────────────────────────────────────────────────

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_PAD = '=';

export function base32Encode(input: string): string {
  if (!input) return '';
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i));
  }
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  const padLength = (8 - (output.length % 8)) % 8;
  return output + BASE32_PAD.repeat(padLength);
}

export function base32Decode(input: string): string {
  if (!input) return '';
  const cleaned = input.toUpperCase().replace(/=+$/, '');
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE32_ALPHABET.length; i++) {
    lookup[BASE32_ALPHABET[i]] = i;
  }
  let bits = 0;
  let value = 0;
  let output = '';
  for (const char of cleaned) {
    if (!(char in lookup)) throw new Error(`Invalid Base32 character: ${char}`);
    value = (value << 5) | lookup[char];
    bits += 5;
    if (bits >= 8) {
      output += String.fromCharCode((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return output;
}

// ─── Base58 ──────────────────────────────────────────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(input: string): string {
  if (!input) return '';
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i));
  }
  let leadingZeros = 0;
  for (const byte of bytes) {
    if (byte === 0) leadingZeros++;
    else break;
  }
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }
  let result = '';
  while (num > BigInt(0)) {
    const remainder = num % BigInt(58);
    num = num / BigInt(58);
    result = BASE58_ALPHABET[Number(remainder)] + result;
  }
  return '1'.repeat(leadingZeros) + result;
}

export function base58Decode(input: string): string {
  if (!input) return '';
  for (const char of input) {
    if (!BASE58_ALPHABET.includes(char)) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
  }
  let leadingOnes = 0;
  for (const char of input) {
    if (char === '1') leadingOnes++;
    else break;
  }
  let num = BigInt(0);
  for (const char of input) {
    num = num * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(char));
  }
  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }
  const allBytes = [...new Array(leadingOnes).fill(0), ...bytes];
  return String.fromCharCode(...allBytes);
}

// ─── Ascii85 ─────────────────────────────────────────────────────────────────

export function ascii85Encode(input: string): string {
  if (!input) return '';
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i));
  }
  while (bytes.length % 4 !== 0) bytes.push(0);
  const padCount = bytes.length - input.length;
  let output = '';
  for (let i = 0; i < bytes.length; i += 4) {
    const value =
      (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    const unsigned = value >>> 0;
    if (unsigned === 0 && i + 4 <= bytes.length - padCount) {
      output += 'z';
    } else {
      let n = unsigned;
      const chunk: string[] = new Array(5);
      for (let j = 4; j >= 0; j--) {
        chunk[j] = String.fromCharCode((n % 85) + 33);
        n = Math.floor(n / 85);
      }
      output += chunk.join('');
    }
  }
  if (padCount > 0) {
    output = output.slice(0, output.length - padCount);
  }
  return output;
}

export function ascii85Decode(input: string): string {
  if (!input) return '';
  const expanded = input.replace(/z/g, '!!!!!');
  const bytes: number[] = [];
  let i = 0;
  while (i < expanded.length) {
    const chunk = expanded.slice(i, i + 5);
    i += 5;
    const padCount = 5 - chunk.length;
    let value = 0;
    for (let j = 0; j < 5; j++) {
      const charCode = j < chunk.length ? chunk.charCodeAt(j) - 33 : 84;
      value = value * 85 + charCode;
    }
    for (let j = 3; j >= 0; j--) {
      if (j >= padCount) {
        bytes.push((value >> (j * 8)) & 0xff);
      }
    }
  }
  return String.fromCharCode(...bytes);
}

// ─── ROT13 ───────────────────────────────────────────────────────────────────

export function rot13(input: string): string {
  if (!input) return '';
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

// ─── ROT47 ───────────────────────────────────────────────────────────────────

export function rot47(input: string): string {
  if (!input) return '';
  return input.replace(/[!-~]/g, (char) => {
    return String.fromCharCode(((char.charCodeAt(0) - 33 + 47) % 94) + 33);
  });
}

// ─── Caesar Cipher ───────────────────────────────────────────────────────────

export function caesarEncode(input: string, shift: number): string {
  if (!input) return '';
  const normalizedShift = ((shift % 26) + 26) % 26;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= 'a' ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + normalizedShift) % 26) + base);
  });
}

export function caesarDecode(input: string, shift: number): string {
  return caesarEncode(input, -shift);
}

// ─── Morse Code ──────────────────────────────────────────────────────────────

const MORSE_TABLE: Record<string, string> = {
  A: '.-',   B: '-...', C: '-.-.', D: '-..',  E: '.',    F: '..-.',
  G: '--.',  H: '....', I: '..',   J: '.---', K: '-.-',  L: '.-..',
  M: '--',   N: '-.',   O: '---',  P: '.--.', Q: '--.-', R: '.-.',
  S: '...',  T: '-',    U: '..-',  V: '...-', W: '.--',  X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

const REVERSE_MORSE_TABLE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([k, v]) => [v, k])
);

export function morseEncode(input: string): string {
  if (!input) return '';
  const words = input.toUpperCase().split(' ');
  return words
    .map((word) =>
      word
        .split('')
        .map((char) => {
          if (!(char in MORSE_TABLE)) throw new Error(`No Morse code for character: ${char}`);
          return MORSE_TABLE[char];
        })
        .join(' ')
    )
    .join(' / ');
}

export function morseDecode(input: string): string {
  if (!input) return '';
  const words = input.split(' / ');
  return words
    .map((word) =>
      word
        .split(' ')
        .map((code) => {
          if (!(code in REVERSE_MORSE_TABLE))
            throw new Error(`Unknown Morse sequence: ${code}`);
          return REVERSE_MORSE_TABLE[code];
        })
        .join('')
    )
    .join(' ');
}

// ─── Punycode ────────────────────────────────────────────────────────────────
// Pure JS implementation of RFC 3492 Punycode, operating label-by-label.

const PUNYCODE_BASE = 36;
const PUNYCODE_TMIN = 1;
const PUNYCODE_TMAX = 26;
const PUNYCODE_SKEW = 38;
const PUNYCODE_DAMP = 700;
const PUNYCODE_INITIAL_BIAS = 72;
const PUNYCODE_INITIAL_N = 128;
const PUNYCODE_DELIMITER = '-';

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  delta = firstTime ? Math.floor(delta / PUNYCODE_DAMP) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > Math.floor(((PUNYCODE_BASE - PUNYCODE_TMIN) * PUNYCODE_TMAX) / 2)) {
    delta = Math.floor(delta / (PUNYCODE_BASE - PUNYCODE_TMIN));
    k += PUNYCODE_BASE;
  }
  return k + Math.floor(((PUNYCODE_BASE - PUNYCODE_TMIN + 1) * delta) / (delta + PUNYCODE_SKEW));
}

function digitToBasic(digit: number): number {
  return digit + (digit < 26 ? 97 : 22);
}

function basicToDigit(codePoint: number): number {
  if (codePoint - 48 < 10) return codePoint - 22;
  if (codePoint - 65 < 26) return codePoint - 65;
  if (codePoint - 97 < 26) return codePoint - 97;
  return PUNYCODE_BASE;
}

function encodePunycodeLabel(input: string): string {
  const codePoints = Array.from(input).map((c) => c.codePointAt(0)!);
  if (codePoints.every((cp) => cp < 128)) return input;
  const basic = codePoints.filter((cp) => cp < 128).map((cp) => String.fromCodePoint(cp)).join('');
  let output = basic;
  if (basic.length) output += PUNYCODE_DELIMITER;
  let n = PUNYCODE_INITIAL_N;
  let delta = 0;
  let bias = PUNYCODE_INITIAL_BIAS;
  let h = basic.length;
  let firstTime = true;
  while (h < codePoints.length) {
    const m = codePoints.filter((cp) => cp >= n).reduce((min, cp) => Math.min(min, cp), Infinity);
    delta += (m - n) * (h + 1);
    n = m;
    for (const cp of codePoints) {
      if (cp < n) delta++;
      if (cp === n) {
        let q = delta;
        for (let k = PUNYCODE_BASE; ; k += PUNYCODE_BASE) {
          const t = k <= bias ? PUNYCODE_TMIN : k >= bias + PUNYCODE_TMAX ? PUNYCODE_TMAX : k - bias;
          if (q < t) break;
          output += String.fromCodePoint(digitToBasic(t + ((q - t) % (PUNYCODE_BASE - t))));
          q = Math.floor((q - t) / (PUNYCODE_BASE - t));
        }
        output += String.fromCodePoint(digitToBasic(q));
        bias = adapt(delta, h + 1, firstTime);
        firstTime = false;
        delta = 0;
        h++;
      }
    }
    delta++;
    n++;
  }
  return 'xn--' + output;
}

function decodePunycodeLabel(input: string): string {
  if (!input.startsWith('xn--')) return input;
  const encoded = input.slice(4);
  const delimiterIdx = encoded.lastIndexOf(PUNYCODE_DELIMITER);
  const basic = delimiterIdx >= 0 ? encoded.slice(0, delimiterIdx) : '';
  const rest = delimiterIdx >= 0 ? encoded.slice(delimiterIdx + 1) : encoded;
  const codePoints: number[] = Array.from(basic).map((c) => c.codePointAt(0)!);
  let n = PUNYCODE_INITIAL_N;
  let i = 0;
  let bias = PUNYCODE_INITIAL_BIAS;
  let pos = 0;
  while (pos < rest.length) {
    const oldI = i;
    let w = 1;
    for (let k = PUNYCODE_BASE; ; k += PUNYCODE_BASE) {
      const digit = basicToDigit(rest.codePointAt(pos)!);
      pos++;
      i += digit * w;
      const t = k <= bias ? PUNYCODE_TMIN : k >= bias + PUNYCODE_TMAX ? PUNYCODE_TMAX : k - bias;
      if (digit < t) break;
      w *= PUNYCODE_BASE - t;
    }
    bias = adapt(i - oldI, codePoints.length + 1, oldI === 0);
    n += Math.floor(i / (codePoints.length + 1));
    i %= codePoints.length + 1;
    codePoints.splice(i, 0, n);
    i++;
  }
  return String.fromCodePoint(...codePoints);
}

export function punycodeEncode(input: string): string {
  if (!input) return '';
  return input.split('.').map(encodePunycodeLabel).join('.');
}

export function punycodeDecode(input: string): string {
  if (!input) return '';
  return input.split('.').map(decodePunycodeLabel).join('.');
}

// ─── Quoted-Printable ────────────────────────────────────────────────────────
// RFC 2045 Quoted-Printable encoding/decoding.
// Operates on UTF-8 byte sequences using pure JS (no TextEncoder/TextDecoder).

function stringToUtf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.codePointAt(i)!;
    if (code > 0xffff) i++; // surrogate pair
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code <= 0xffff) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

function utf8BytesToString(bytes: number[]): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    let codePoint: number;
    if (byte <= 0x7f) {
      codePoint = byte; i++;
    } else if ((byte & 0xe0) === 0xc0) {
      codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f); i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      codePoint = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f); i += 3;
    } else {
      codePoint = ((byte & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f); i += 4;
    }
    result += String.fromCodePoint(codePoint);
  }
  return result;
}

export function quotedPrintableEncode(input: string): string {
  if (!input) return '';
  const bytes = stringToUtf8Bytes(input);
  let result = '';
  for (const byte of bytes) {
    if (byte === 0x3d) {
      result += '=3D';
    } else if ((byte >= 0x21 && byte <= 0x7e) || byte === 0x09 || byte === 0x20) {
      result += String.fromCharCode(byte);
    } else {
      result += '=' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }
  return result;
}

export function quotedPrintableDecode(input: string): string {
  if (!input) return '';
  const cleaned = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < cleaned.length) {
    if (cleaned[i] === '=' && i + 2 < cleaned.length) {
      const hex = cleaned.slice(i + 1, i + 3);
      bytes.push(parseInt(hex, 16));
      i += 3;
    } else {
      bytes.push(cleaned.charCodeAt(i));
      i++;
    }
  }
  return utf8BytesToString(bytes);
}

// ─── Base64URL ───────────────────────────────────────────────────────────────
// RFC 4648 §5 — Base64URL encoding (no padding, url-safe chars)

export function base64urlEncode(input: string): string {
  if (!input) return '';
  // Pure JS UTF-8 encoding without browser APIs
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let code = input.codePointAt(i)!;
    if (code > 0xffff) i++;
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code <= 0xffff) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return Buffer.from(binary, 'binary').toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64urlDecode(input: string): string {
  if (!input) return '';
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const paddedStr = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = Buffer.from(paddedStr, 'base64').toString('binary');
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i++) bytes.push(binary.charCodeAt(i));
  // Decode UTF-8 bytes
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    let codePoint: number;
    if (byte <= 0x7f) {
      codePoint = byte; i++;
    } else if ((byte & 0xe0) === 0xc0) {
      codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f); i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      codePoint = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f); i += 3;
    } else {
      codePoint = ((byte & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f); i += 4;
    }
    result += String.fromCodePoint(codePoint);
  }
  return result;
}

// ─── JWT Decoder ─────────────────────────────────────────────────────────────

export function jwtDecode(input: string): string {
  if (!input.trim()) return '';
  const parts = input.trim().split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT: must have exactly three parts separated by "."');

  function base64urlDecode(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice((base64.length + 3) & 3);
    try {
      return Buffer.from(padded, 'base64').toString('utf-8');
    } catch {
      throw new Error(`Invalid base64url segment: ${str}`);
    }
  }

  const headerRaw = base64urlDecode(parts[0]);
  const payloadRaw = base64urlDecode(parts[1]);

  let header: unknown;
  let payload: unknown;
  try {
    header = JSON.parse(headerRaw);
  } catch {
    throw new Error('JWT header is not valid JSON');
  }
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    throw new Error('JWT payload is not valid JSON');
  }

  return JSON.stringify({ header, payload, signature: parts[2] }, null, 2);
}
