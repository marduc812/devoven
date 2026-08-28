import { parseKey, xorEncrypt, xorDecrypt, isHexString, processXor } from '@/Components/Functions/XorCipherTools/logic';

describe('parseKey', () => {
  it('parses text key as char codes', () => {
    expect(parseKey('A', 'text')).toEqual([65]);
  });
  it('parses hex key', () => {
    expect(parseKey('FF', 'hex')).toEqual([255]);
  });
  it('parses 0x prefixed hex key', () => {
    expect(parseKey('0xFF', 'hex')).toEqual([255]);
  });
  it('throws on empty key', () => {
    expect(() => parseKey('', 'text')).toThrow();
  });
  it('throws on odd-length hex', () => {
    expect(() => parseKey('ABC', 'hex')).toThrow();
  });
});

describe('xorEncrypt / xorDecrypt', () => {
  it('encrypts then decrypts back to original', () => {
    const key = parseKey('secret', 'text');
    const cipher = xorEncrypt('Hello', key);
    const plain = xorDecrypt(cipher, key);
    expect(plain).toBe('Hello');
  });
  it('single byte XOR is correct', () => {
    const key = [0x00];
    const result = xorEncrypt('A', key);
    expect(result).toBe('41');
  });
  it('XOR with 0xFF flips all bits', () => {
    const key = [0xFF];
    const cipher = xorEncrypt('A', key);
    const plain = xorDecrypt(cipher, key);
    expect(plain).toBe('A');
  });
});

describe('isHexString', () => {
  it('detects hex string', () => expect(isHexString('ab cd ef')).toBe(true));
  it('rejects plain text', () => expect(isHexString('hello')).toBe(false));
  it('detects single hex byte', () => expect(isHexString('ff')).toBe(true));
});

describe('processXor', () => {
  it('encrypts text', () => {
    const result = processXor('key: A\nHello', 'text');
    expect(result).toContain('Encrypt');
    expect(result).toContain('hex');
  });
  it('throws without key line', () => {
    expect(() => processXor('Hello', 'text')).toThrow();
  });
  it('throws for single line', () => {
    expect(() => processXor('key: A', 'text')).toThrow();
  });
  it('round-trips encrypt then decrypt', () => {
    const encrypted = processXor('key: secret\nHello World', 'text');
    const hexLine = encrypted.split('\n').filter(l => /^[0-9a-f]{2}/.test(l.trim()))[0];
    const decrypted = processXor('key: secret\n' + hexLine, 'text');
    expect(decrypted).toContain('Decrypt');
    expect(decrypted).toContain('Hello World');
  });
});
