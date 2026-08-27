// ─── Base85 / Ascii85 ─────────────────────────────────────────────────────────
// Groups 4 bytes → 5 ASCII chars (33..117). Special case: 4 zero bytes → 'z'.
// Supports both Adobe Ascii85 (<~...~> delimiters) and raw Base85.

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

export function base85Encode(input: string, adobeMode: boolean = true): string {
  if (!input) return '';

  const bytes = stringToBytes(input);
  const parts: string[] = [];

  for (let i = 0; i < bytes.length; i += 4) {
    const group = bytes.slice(i, i + 4);
    const padded = group.length;

    // Pad to 4 bytes
    while (group.length < 4) group.push(0);

    // Combine 4 bytes into a 32-bit number (big-endian) using only 32-bit safe ops
    // b0 * 16777216 + b1 * 65536 + b2 * 256 + b3
    const b0 = group[0];
    const b1 = group[1];
    const b2 = group[2];
    const b3 = group[3];
    const n = (b0 * 16777216 + b1 * 65536 + b2 * 256 + b3) >>> 0;

    if (n === 0 && padded === 4) {
      parts.push('z');
      continue;
    }

    // Encode as 5 base-85 digits
    let val = n;
    const chars = ['', '', '', '', ''];
    for (let j = 4; j >= 0; j--) {
      chars[j] = String.fromCharCode((val % 85) + 33);
      val = Math.floor(val / 85);
    }

    // For partial last group, output only padded+1 chars
    if (padded < 4) {
      parts.push(chars.slice(0, padded + 1).join(''));
    } else {
      parts.push(chars.join(''));
    }
  }

  const raw = parts.join('');
  return adobeMode ? '<~' + raw + '~>' : raw;
}

export function base85Decode(input: string): string {
  if (!input.trim()) return '';

  let raw = input.trim();

  // Strip Adobe delimiters if present
  const isAdobe = raw.startsWith('<~') && raw.endsWith('~>');
  if (isAdobe) {
    raw = raw.slice(2, -2);
  }

  // Remove whitespace
  raw = raw.replace(/\s/g, '');

  const bytes: number[] = [];
  let i = 0;

  while (i < raw.length) {
    if (raw[i] === 'z') {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    const group = raw.slice(i, i + 5);
    const count = group.length;

    if (count === 0) break;

    // Pad to 5 chars
    const padded = group + 'u'.repeat(5 - count);

    let n = 0;
    for (let j = 0; j < 5; j++) {
      const c = padded.charCodeAt(j) - 33;
      if (c < 0 || c > 84) {
        throw new Error('Invalid Base85 character: ' + padded[j]);
      }
      // n = n * 85 + c, keep in 32-bit unsigned range
      n = (n * 85 + c) >>> 0;
    }

    // Extract 4 bytes
    const b0 = (n >>> 24) & 0xff;
    const b1 = (n >>> 16) & 0xff;
    const b2 = (n >>> 8) & 0xff;
    const b3 = n & 0xff;

    if (count === 5) {
      bytes.push(b0, b1, b2, b3);
    } else {
      // Partial last group: output count-1 bytes
      const output = [b0, b1, b2, b3].slice(0, count - 1);
      bytes.push(...output);
    }

    i += 5;
  }

  return bytesToString(bytes);
}

export type Base85Direction = 'encode' | 'decode';
export type Base85Mode = 'adobe' | 'raw';

export function isLikelyBase85Encoded(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.startsWith('<~') && trimmed.endsWith('~>')) return true;
  // Raw base85: characters in range 33–117
  const raw = trimmed.replace(/\s/g, '');
  if (raw.length === 0) return false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (raw[i] !== 'z' && (c < 33 || c > 117)) return false;
  }
  return true;
}

export function autoConvert(input: string, mode: Base85Mode): string {
  if (!input.trim()) return '';
  if (isLikelyBase85Encoded(input)) {
    return base85Decode(input);
  }
  return base85Encode(input, mode === 'adobe');
}
