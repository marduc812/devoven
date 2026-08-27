import { generateOtpSecret, bytesToBase32, formatOtpUri, formatOtpInfo, otpQrFilename } from '../Components/Functions/OtpSecretTools/logic';

// ─── bytesToBase32 ────────────────────────────────────────────────────────────

describe('bytesToBase32', () => {
  it('encodes empty array to empty string', () => {
    expect(bytesToBase32([])).toBe('');
  });

  it('encodes single byte', () => {
    const result = bytesToBase32([0]);
    expect(result).toMatch(/^[A-Z2-7]+$/);
  });

  it('uses only valid base32 characters', () => {
    const result = bytesToBase32([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result).toMatch(/^[A-Z2-7]+$/);
  });

  it('encodes known value correctly', () => {
    // [0] -> 00000000 -> first 5 bits: 00000 = 'A', next 3 bits + padding = 'A'
    expect(bytesToBase32([0, 0, 0, 0, 0])).toBe('AAAAAAAAAA'.slice(0, 8));
  });

  it('produces length proportional to input bytes', () => {
    const result = bytesToBase32(new Array(20).fill(0));
    // 20 bytes = 160 bits, 160/5 = 32 chars
    expect(result).toHaveLength(32);
  });
});

// ─── generateOtpSecret ────────────────────────────────────────────────────────

describe('generateOtpSecret', () => {
  it('generates a non-empty string', () => {
    expect(generateOtpSecret()).toBeTruthy();
  });

  it('uses only valid base32 characters', () => {
    const secret = generateOtpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('generates 32-char secret for 160 bits', () => {
    // 160 bits = 20 bytes = 32 base32 chars
    expect(generateOtpSecret(160)).toHaveLength(32);
  });

  it('generates different secrets each time', () => {
    const secrets = new Set(Array.from({ length: 10 }, () => generateOtpSecret()));
    expect(secrets.size).toBeGreaterThan(5);
  });

  it('accepts custom bit length', () => {
    const secret = generateOtpSecret(80);
    // 80 bits = 10 bytes = 16 base32 chars
    expect(secret).toHaveLength(16);
  });
});

// ─── formatOtpUri ─────────────────────────────────────────────────────────────

describe('formatOtpUri', () => {
  it('returns valid otpauth URI', () => {
    const uri = formatOtpUri('ABCDEF', 'MyApp', 'user@example.com');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
  });

  it('includes secret in URI', () => {
    const uri = formatOtpUri('ABCDEF', 'MyApp', 'user@example.com');
    expect(uri).toContain('secret=ABCDEF');
  });

  it('includes issuer in URI', () => {
    const uri = formatOtpUri('ABCDEF', 'MyApp', 'user@example.com');
    expect(uri).toContain('issuer=MyApp');
  });

  it('includes algorithm in URI', () => {
    const uri = formatOtpUri('ABCDEF', 'MyApp', 'user@example.com');
    expect(uri).toContain('algorithm=SHA1');
  });

  it('includes digits=6 in URI', () => {
    const uri = formatOtpUri('ABCDEF', 'MyApp', 'user@example.com');
    expect(uri).toContain('digits=6');
  });

  it('includes period=30 in URI', () => {
    const uri = formatOtpUri('ABCDEF', 'MyApp', 'user@example.com');
    expect(uri).toContain('period=30');
  });

  it('URL-encodes special characters', () => {
    const uri = formatOtpUri('ABCDEF', 'My App', 'user@example.com');
    expect(uri).toContain('My%20App');
  });
});

// ─── otpQrFilename ────────────────────────────────────────────────────────────

describe('otpQrFilename', () => {
  it('joins issuer and account', () => {
    expect(otpQrFilename('MyApp', 'user@example.com')).toBe('MyApp-user-example.com.png');
  });

  it('replaces unsafe characters', () => {
    expect(otpQrFilename('My/App', 'a:b?c')).toBe('My-App-a-b-c.png');
  });

  it('collapses runs of separators', () => {
    expect(otpQrFilename('My   App', 'user')).toBe('My-App-user.png');
  });

  it('trims leading and trailing separators', () => {
    expect(otpQrFilename(' MyApp ', ' user ')).toBe('MyApp-user.png');
  });

  it('omits an empty issuer', () => {
    expect(otpQrFilename('', 'user')).toBe('user.png');
  });

  it('omits an empty account', () => {
    expect(otpQrFilename('MyApp', '')).toBe('MyApp.png');
  });

  it('falls back to otp.png when both are blank', () => {
    expect(otpQrFilename('', '')).toBe('otp.png');
  });

  it('falls back to otp.png when both sanitize to nothing', () => {
    expect(otpQrFilename('///', '   ')).toBe('otp.png');
  });
});

// ─── formatOtpInfo ────────────────────────────────────────────────────────────

describe('formatOtpInfo', () => {
  it('includes secret in output', () => {
    const result = formatOtpInfo('ABCDEF');
    expect(result).toContain('ABCDEF');
  });

  it('includes default issuer', () => {
    const result = formatOtpInfo('ABCDEF');
    expect(result).toContain('MyApp');
  });

  it('includes custom issuer', () => {
    const result = formatOtpInfo('ABCDEF', 'Acme');
    expect(result).toContain('Acme');
  });

  it('includes otpauth URI', () => {
    const result = formatOtpInfo('ABCDEF');
    expect(result).toContain('otpauth://totp/');
  });

  it('mentions authenticator compatibility', () => {
    const result = formatOtpInfo('ABCDEF');
    expect(result.toLowerCase()).toContain('authenticator');
  });
});
