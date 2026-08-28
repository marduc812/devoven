// All functions in this file are pure (no React, no browser APIs).
// UUID/ULID/QR/Barcode/Bcrypt generation is intentionally NOT here — those
// require library calls with crypto.getRandomValues or async hashing and live
// in component handlers in index.tsx.

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Joins an array of UUID strings into a newline-separated block of text.
 */
export function formatUuidsAsText(uuids: string[]): string {
  return uuids.join('\n');
}

/**
 * Joins an array of ULID strings into a newline-separated block of text.
 */
export function formatUlidsAsText(ulids: string[]): string {
  return ulids.join('\n');
}

// ─── vCard builder ────────────────────────────────────────────────────────────

/**
 * Builds a vCard 3.0 string suitable for encoding into a QR code.
 * Fields with empty values are omitted.
 */
export function buildVCard(
  name: string,
  phone: string,
  email: string,
  url: string,
): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (name) lines.push(`FN:${name}`);
  if (phone) lines.push(`TEL:${phone}`);
  if (email) lines.push(`EMAIL:${email}`);
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

// ─── Bcrypt helpers ───────────────────────────────────────────────────────────

/**
 * Clamps the requested bcrypt work-factor rounds to a safe range [4, 14].
 * Values below 4 are too weak; values above 14 are prohibitively slow in-browser.
 */
export function validateBcryptRounds(rounds: number): number {
  if (rounds < 4) return 4;
  if (rounds > 14) return 14;
  return Math.floor(rounds);
}

// ─── .htpasswd helpers ────────────────────────────────────────────────────────

/**
 * Combines a username and a pre-computed hash into an htpasswd-formatted line.
 * Example: buildHtpasswdEntry('alice', '$2a$10$abc...') → 'alice:$2a$10$abc...'
 */
export function buildHtpasswdEntry(username: string, hash: string): string {
  return `${username}:${hash}`;
}

// ─── RSA / PEM helpers ────────────────────────────────────────────────────────

/**
 * Converts an ArrayBuffer (PKCS#8/SPKI export from WebCrypto) to a PEM string.
 * Lines are wrapped at 64 characters per the PEM standard.
 *
 * Note: `btoa` is available as a global in Node 16+ and all modern browsers,
 * so this function is testable in Jest (Node env) without additional setup.
 */
export function arrayBufferToPem(
  buffer: ArrayBuffer,
  label: 'PUBLIC KEY' | 'PRIVATE KEY',
): string {
  const uint8 = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}
