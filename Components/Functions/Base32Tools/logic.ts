// Pure TypeScript — no browser APIs, no React.
// Base32 encode/decode (RFC 4648). No BigInt.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PADDING = '=';

function charToVal(c: string): number {
  const idx = ALPHABET.indexOf(c.toUpperCase());
  if (idx === -1) throw new Error('Invalid Base32 character: ' + c);
  return idx;
}

export function base32Encode(input: string): string {
  if (!input) return '';
  // Convert string to bytes (UTF-8 subset: only latin-1 for simplicity)
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code > 127) {
      // Encode as UTF-8
      if (code < 2048) {
        bytes.push(0xc0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3f));
      } else {
        bytes.push(0xe0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3f));
        bytes.push(0x80 | (code & 0x3f));
      }
    } else {
      bytes.push(code);
    }
  }

  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i] || 0;
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const b3 = i + 3 < bytes.length ? bytes[i + 3] : 0;
    const b4 = i + 4 < bytes.length ? bytes[i + 4] : 0;

    result += ALPHABET[(b0 >> 3) & 0x1f];
    result += ALPHABET[((b0 & 0x07) << 2) | ((b1 >> 6) & 0x03)];

    if (i + 1 >= bytes.length) { result += PADDING + PADDING + PADDING + PADDING + PADDING + PADDING; break; }
    result += ALPHABET[(b1 >> 1) & 0x1f];
    result += ALPHABET[((b1 & 0x01) << 4) | ((b2 >> 4) & 0x0f)];

    if (i + 2 >= bytes.length) { result += PADDING + PADDING + PADDING + PADDING; break; }
    result += ALPHABET[((b2 & 0x0f) << 1) | ((b3 >> 7) & 0x01)];

    if (i + 3 >= bytes.length) { result += PADDING + PADDING + PADDING; break; }
    result += ALPHABET[(b3 >> 2) & 0x1f];
    result += ALPHABET[((b3 & 0x03) << 3) | ((b4 >> 5) & 0x07)];

    if (i + 4 >= bytes.length) { result += PADDING; break; }
    result += ALPHABET[b4 & 0x1f];

    i += 5;
  }

  return result;
}

export function base32Decode(input: string): string {
  if (!input) return '';
  const cleaned = input.replace(/\s/g, '').toUpperCase();

  // Validate
  if (!/^[A-Z2-7]+=*$/.test(cleaned)) {
    throw new Error('Invalid Base32 input');
  }

  const withoutPad = cleaned.replace(/=+$/, '');
  const bytes: number[] = [];
  let i = 0;

  while (i < withoutPad.length) {
    const v0 = charToVal(withoutPad[i] || 'A');
    const v1 = charToVal(withoutPad[i + 1] || 'A');
    const v2 = i + 2 < withoutPad.length ? charToVal(withoutPad[i + 2]) : 0;
    const v3 = i + 3 < withoutPad.length ? charToVal(withoutPad[i + 3]) : 0;
    const v4 = i + 4 < withoutPad.length ? charToVal(withoutPad[i + 4]) : 0;
    const v5 = i + 5 < withoutPad.length ? charToVal(withoutPad[i + 5]) : 0;
    const v6 = i + 6 < withoutPad.length ? charToVal(withoutPad[i + 6]) : 0;
    const v7 = i + 7 < withoutPad.length ? charToVal(withoutPad[i + 7]) : 0;

    bytes.push((v0 << 3) | (v1 >> 2));
    if (i + 2 < withoutPad.length) bytes.push(((v1 & 0x03) << 6) | (v2 << 1) | (v3 >> 4));
    if (i + 4 < withoutPad.length) bytes.push(((v3 & 0x0f) << 4) | (v4 >> 1));
    if (i + 5 < withoutPad.length) bytes.push(((v4 & 0x01) << 7) | (v5 << 2) | (v6 >> 3));
    if (i + 7 < withoutPad.length) bytes.push(((v6 & 0x07) << 5) | v7);

    i += 8;
  }

  // Convert bytes back to string
  let result = '';
  let bi = 0;
  while (bi < bytes.length) {
    const byte = bytes[bi];
    if (byte < 128) {
      result += String.fromCharCode(byte);
      bi += 1;
    } else if ((byte & 0xe0) === 0xc0) {
      const b2 = bytes[bi + 1] || 0;
      result += String.fromCharCode(((byte & 0x1f) << 6) | (b2 & 0x3f));
      bi += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      const b2 = bytes[bi + 1] || 0;
      const b3 = bytes[bi + 2] || 0;
      result += String.fromCharCode(((byte & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
      bi += 3;
    } else {
      // Skip unknown byte sequences
      result += '?';
      bi += 1;
    }
  }

  return result;
}

export function isBase32(input: string): boolean {
  const cleaned = input.trim().replace(/\s/g, '').toUpperCase();
  return cleaned.length > 0 && /^[A-Z2-7]+=*$/.test(cleaned);
}

export function autoConvert(input: string): { encoded: string; decoded: string; direction: string } {
  const trimmed = input.trim();
  if (!trimmed) return { encoded: '', decoded: '', direction: '' };

  if (isBase32(trimmed)) {
    try {
      const decoded = base32Decode(trimmed);
      const encoded = base32Encode(decoded);
      return { encoded, decoded, direction: 'decode' };
    } catch {
      // Fall through to encode
    }
  }

  const encoded = base32Encode(trimmed);
  return { encoded, decoded: trimmed, direction: 'encode' };
}
