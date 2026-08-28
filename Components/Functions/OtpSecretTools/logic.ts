// Base32 alphabet (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateOtpSecret(bits = 160): string {
  // Generate random bytes using Math.random for Jest compatibility
  // Production component should use crypto.getRandomValues
  const byteCount = Math.ceil(bits / 8);
  const randomValues: number[] = [];
  for (let i = 0; i < byteCount; i++) {
    randomValues.push(Math.floor(Math.random() * 256));
  }
  return bytesToBase32(randomValues);
}

export function bytesToBase32(bytes: number[]): string {
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_CHARS[(buffer >> bitsLeft) & 31];
    }
  }

  if (bitsLeft > 0) {
    result += BASE32_CHARS[(buffer << (5 - bitsLeft)) & 31];
  }

  return result;
}

export function formatOtpUri(secret: string, issuer: string, account: string): string {
  const enc = (s: string) => encodeURIComponent(s);
  return `otpauth://totp/${enc(issuer)}:${enc(account)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function otpQrFilename(issuer: string, account: string): string {
  const clean = (s: string) =>
    s
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const parts = [clean(issuer), clean(account)].filter(Boolean);
  return (parts.length > 0 ? parts.join('-') : 'otp') + '.png';
}

export function formatOtpInfo(secret: string, issuer = 'MyApp', account = 'user@example.com'): string {
  return [
    `Secret:  ${secret}`,
    `Issuer:  ${issuer}`,
    `Account: ${account}`,
    `URI:     ${formatOtpUri(secret, issuer, account)}`,
    '',
    'Compatible with Google Authenticator, Authy, 1Password, etc.',
  ].join('\n');
}
