// ─── Shared Base64Url helpers ────────────────────────────────────────────────

export function encodeBase64Url(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── AES helpers ─────────────────────────────────────────────────────────────

export function formatAesOutput(salt: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): string {
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);
  return encodeBase64Url(combined);
}

export function parseAesInput(encoded: string): { salt: Uint8Array<ArrayBuffer>; iv: Uint8Array<ArrayBuffer>; ciphertext: Uint8Array<ArrayBuffer> } {
  const bytes = decodeBase64Url(encoded);
  if (bytes.length < 28) throw new Error('Invalid encrypted data — too short');
  return {
    salt: bytes.slice(0, 16),
    iv: bytes.slice(16, 28),
    ciphertext: bytes.slice(28),
  };
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

export function buildJwtHeader(): string {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
}

export function buildJwtPayload(claims: Record<string, unknown>): string {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
}

export function parseJwtClaims(input: string): Record<string, unknown> {
  try {
    return JSON.parse(input);
  } catch {
    throw new Error('Invalid JSON claims');
  }
}

// ─── TOTP helpers ─────────────────────────────────────────────────────────────

export function base32DecodeToBytes(input: string): Uint8Array<ArrayBuffer> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const bytes: number[] = [];
  let buffer = 0, bitsLeft = 0;
  for (const char of cleaned) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error(`Invalid Base32 character: ${char}`);
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 255);
    }
  }
  return new Uint8Array(bytes);
}

export function totpTimeStep(unixSeconds?: number): number {
  return Math.floor((unixSeconds ?? Math.floor(Date.now() / 1000)) / 30);
}

export function timeStepToBytes(step: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(8);
  let tmp = step;
  for (let i = 7; i >= 0; i--) {
    buf[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }
  return buf;
}

export function hotp(hmacResult: Uint8Array): number {
  const offset = hmacResult[19] & 0xf;
  return (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % 1000000;
}

export function formatTotp(code: number): string {
  return code.toString().padStart(6, '0');
}

export function totpSecondsRemaining(unixSeconds?: number): number {
  const now = unixSeconds ?? Math.floor(Date.now() / 1000);
  return 30 - (now % 30);
}

// ─── Extract from Text helpers ────────────────────────────────────────────────

export type ExtractType = 'emails' | 'urls' | 'ips' | 'phones' | 'dates' | 'creditcards';

export function extractFromText(text: string, type: ExtractType): string[] {
  if (!text.trim()) return [];
  const patterns: Record<ExtractType, RegExp> = {
    emails: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    urls: /https?:\/\/[^\s<>"{}|\\^`[\]]+/g,
    ips: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    phones: /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,
    dates: /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
    creditcards: /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|3(?:0[0-5]|[68]\d)\d{11}|6(?:011|5\d{2})\d{12})\b/g,
  };
  const matches = text.match(patterns[type]) ?? [];
  return [...new Set(matches)];
}

export function formatExtractResults(matches: string[], type: ExtractType): string {
  if (matches.length === 0) return `No ${type} found.`;
  return matches.join('\n');
}
