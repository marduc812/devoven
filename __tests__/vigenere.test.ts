import { vigenereEncrypt, vigenereDecrypt } from '@/Components/Functions/VigenereCipherTools/logic';
describe('vigenereEncrypt', () => {
  it('encrypts ATTACK with key LEMON', () => expect(vigenereEncrypt('ATTACK', 'LEMON')).toBe('LXFOPV'));
  it('preserves non-alpha characters', () => expect(vigenereEncrypt('A B', 'KEY')).toBe('K F'));
  it('handles lowercase', () => expect(vigenereEncrypt('attack', 'lemon')).toBe('lxfopv'));
  it('throws for empty key', () => expect(() => vigenereEncrypt('test', '')).toThrow());
});
describe('vigenereDecrypt', () => {
  it('decrypts LXFOPV with key LEMON back to ATTACK', () => expect(vigenereDecrypt('LXFOPV', 'LEMON')).toBe('ATTACK'));
  it('is inverse of encrypt', () => {
    const encrypted = vigenereEncrypt('Hello World', 'SECRET');
    expect(vigenereDecrypt(encrypted, 'SECRET')).toBe('Hello World');
  });
  it('throws for empty key', () => expect(() => vigenereDecrypt('test', '')).toThrow());
});
