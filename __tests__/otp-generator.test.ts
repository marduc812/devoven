import { generateOtpKey, otpEncrypt, otpDecrypt, bytesToHex, hexToBytes, bytesToLetters, processOtpEncrypt, processOtpDecrypt } from '@/Components/Functions/OtpGeneratorTools/logic';

describe('generateOtpKey', () => {
  it('generates correct length', () => {
    expect(generateOtpKey(10).length).toBe(10);
    expect(generateOtpKey(0).length).toBe(0);
  });

  it('values in range 0-255', () => {
    const key = generateOtpKey(100);
    for (let i = 0; i < key.length; i++) {
      expect(key[i]).toBeGreaterThanOrEqual(0);
      expect(key[i]).toBeLessThanOrEqual(255);
    }
  });
});

describe('bytesToHex / hexToBytes', () => {
  it('round-trips', () => {
    const bytes = [0, 1, 15, 16, 255];
    expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
  });

  it('pads single hex digit', () => {
    expect(bytesToHex([1])).toBe('01');
    expect(bytesToHex([255])).toBe('ff');
  });

  it('throws on odd-length hex', () => {
    expect(() => hexToBytes('abc')).toThrow();
  });

  it('throws on invalid hex', () => {
    expect(() => hexToBytes('zz')).toThrow();
  });
});

describe('otpEncrypt / otpDecrypt', () => {
  it('XOR encrypts correctly', () => {
    const text = 'Hello';
    const key = generateOtpKey(text.length);
    const cipher = otpEncrypt(text, key);
    const keyHex = bytesToHex(key);
    const cipherHex = bytesToHex(cipher);
    const decrypted = otpDecrypt(cipherHex, keyHex);
    expect(decrypted).toBe(text);
  });

  it('decrypt throws if key too short', () => {
    expect(() => otpDecrypt('aabb', '00')).toThrow();
  });
});

describe('bytesToLetters', () => {
  it('maps bytes to A-Z letters', () => {
    const letters = bytesToLetters([0, 1, 25]);
    expect(letters).toBe('ABZ');
  });

  it('wraps around with mod 26', () => {
    const letters = bytesToLetters([26]);
    expect(letters).toBe('A');
  });
});

describe('processOtpEncrypt', () => {
  it('returns empty for empty input', () => {
    expect(processOtpEncrypt('')).toBe('');
  });

  it('contains warning and key hex and cipher hex', () => {
    const r = processOtpEncrypt('Hello');
    expect(r).toContain('WARNING');
    expect(r).toContain('Key (hex)');
    expect(r).toContain('Cipher (hex)');
    expect(r).toContain('Hello');
  });
});

describe('processOtpDecrypt', () => {
  it('returns empty for empty inputs', () => {
    expect(processOtpDecrypt('', '')).toBe('');
    expect(processOtpDecrypt('aabb', '')).toBe('');
  });

  it('decrypts correctly', () => {
    const text = 'Hi';
    const key = [10, 20];
    const cipher = otpEncrypt(text, key);
    const r = processOtpDecrypt(bytesToHex(cipher), bytesToHex(key));
    expect(r).toContain('Hi');
  });
});
