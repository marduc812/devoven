export type XorKeyFormat = 'text' | 'hex';

export interface XorResult {
  output: string;
  keyBytes: number[];
  inputBytes: number[];
  mode: 'encrypt' | 'decrypt';
}

export function parseKey(key: string, format: XorKeyFormat): number[] {
  if (!key.trim()) throw new Error('Key cannot be empty');
  if (format === 'hex') {
    const clean = key.replace(/\s/g, '').replace(/^0x/i, '');
    if (clean.length === 0) throw new Error('Hex key is empty');
    if (clean.length % 2 !== 0) throw new Error('Hex key must have even number of digits');
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
      const b = parseInt(clean.slice(i, i + 2), 16);
      if (isNaN(b)) throw new Error('Invalid hex key');
      bytes.push(b);
    }
    return bytes;
  }
  // text key
  const bytes: number[] = [];
  for (let i = 0; i < key.length; i++) {
    bytes.push(key.charCodeAt(i) & 0xff);
  }
  return bytes;
}

export function xorEncrypt(text: string, keyBytes: number[]): string {
  if (keyBytes.length === 0) throw new Error('Key cannot be empty');
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const b = text.charCodeAt(i) & 0xff;
    const x = b ^ keyBytes[i % keyBytes.length];
    result.push(x.toString(16).padStart(2, '0'));
  }
  return result.join(' ');
}

export function xorDecrypt(hexInput: string, keyBytes: number[]): string {
  if (keyBytes.length === 0) throw new Error('Key cannot be empty');
  const clean = hexInput.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ').filter(p => p.length > 0);
  const chars: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const b = parseInt(parts[i], 16);
    if (isNaN(b)) throw new Error('Invalid hex input: ' + parts[i]);
    const x = b ^ keyBytes[i % keyBytes.length];
    chars.push(String.fromCharCode(x));
  }
  return chars.join('');
}

export function isHexString(s: string): boolean {
  const clean = s.trim().replace(/\s+/g, ' ');
  return /^([0-9a-fA-F]{2}\s*)+$/.test(clean);
}

/**
 * Process XOR cipher input. Input format:
 * Line 1: "key: mykey" or "key: 0xAB" or "key: AB CD EF" (hex bytes)
 * Line 2+: text to encrypt OR hex to decrypt (auto-detected)
 */
export function processXor(rawInput: string, keyFormat: XorKeyFormat): string {
  const lines = rawInput.split('\n');
  if (lines.length < 2) throw new Error('Input must have at least 2 lines: key line + text');

  const keyLine = lines[0].trim();
  if (!keyLine.toLowerCase().startsWith('key:')) {
    throw new Error('First line must start with "key: "');
  }
  const keyValue = keyLine.slice(4).trim();
  const keyBytes = parseKey(keyValue, keyFormat);

  const content = lines.slice(1).join('\n');
  if (!content.trim()) throw new Error('No content to process');

  if (isHexString(content)) {
    const plaintext = xorDecrypt(content, keyBytes);
    return 'Mode: Decrypt (hex → text)\n\nPlaintext:\n' + plaintext;
  } else {
    const cipherHex = xorEncrypt(content, keyBytes);
    return 'Mode: Encrypt (text → hex)\n\nCiphertext (hex):\n' + cipherHex;
  }
}
