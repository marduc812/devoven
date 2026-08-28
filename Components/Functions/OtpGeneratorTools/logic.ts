// One-Time Pad using Math.random() — NOT cryptographically secure

function randomByte(): number {
  return Math.floor(Math.random() * 256);
}

export function generateOtpKey(length: number): number[] {
  const key: number[] = [];
  for (let i = 0; i < length; i++) {
    key.push(randomByte());
  }
  return key;
}

export function otpEncrypt(text: string, key: number[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i) ^ key[i % key.length]);
  }
  return bytes;
}

export function otpDecrypt(hexCipher: string, hexKey: string): string {
  const cipherBytes = hexToBytes(hexCipher);
  const keyBytes = hexToBytes(hexKey);
  if (keyBytes.length < cipherBytes.length) throw new Error('Key must be at least as long as ciphertext');
  let result = '';
  for (let i = 0; i < cipherBytes.length; i++) {
    result += String.fromCharCode(cipherBytes[i] ^ keyBytes[i]);
  }
  return result;
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => {
    const h = b.toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

export function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/\s/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have even length');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const val = parseInt(clean.slice(i, i + 2), 16);
    if (isNaN(val)) throw new Error('Invalid hex character');
    bytes.push(val);
  }
  return bytes;
}

export function bytesToLetters(bytes: number[]): string {
  return bytes.map(b => String.fromCharCode(65 + (b % 26))).join('');
}

export function processOtpEncrypt(text: string): string {
  if (!text.trim()) return '';
  const key = generateOtpKey(text.length);
  const cipher = otpEncrypt(text, key);
  const keyHex = bytesToHex(key);
  const keyLetters = bytesToLetters(key);
  const cipherHex = bytesToHex(cipher);

  const lines: string[] = [
    '⚠ WARNING: Math.random() is NOT cryptographically secure. For real OTP use a CSPRNG.',
    '',
    'Plaintext:      ' + text,
    'Key (hex):      ' + keyHex,
    'Key (letters):  ' + keyLetters,
    'Cipher (hex):   ' + cipherHex,
  ];
  return lines.join('\n');
}

export function processOtpDecrypt(hexCipher: string, hexKey: string): string {
  if (!hexCipher.trim() || !hexKey.trim()) return '';
  const result = otpDecrypt(hexCipher, hexKey);
  const lines: string[] = [
    '⚠ WARNING: Math.random() is NOT cryptographically secure.',
    '',
    'Decrypted: ' + result,
  ];
  return lines.join('\n');
}
