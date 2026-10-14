import { substitute, DEFAULT_CIPHER_ALPHABET, PLAIN_ALPHABET } from '@/Components/Functions/SubstitutionCipherTools/logic';

describe('substitution cipher', () => {
  it('maps a known alphabet while preserving case and other characters', () => {
    expect(substitute('Abc XYZ! 123\né😀', DEFAULT_CIPHER_ALPHABET, 'encrypt')).toBe('Qwe BNM! 123\né😀');
  });
  it('reverses the entire mapping', () => {
    const text = PLAIN_ALPHABET + PLAIN_ALPHABET.toLowerCase() + ' 123!\n';
    const encoded = substitute(text, DEFAULT_CIPHER_ALPHABET, 'encrypt');
    expect(substitute(encoded, DEFAULT_CIPHER_ALPHABET, 'decrypt')).toBe(text);
  });
  it('accepts a lowercase alphabet and surrounding whitespace', () => {
    expect(substitute('Hello!', ' ' + PLAIN_ALPHABET.toLowerCase() + ' ', 'encrypt')).toBe('Hello!');
  });
  it.each(['', 'ABC', 'A'.repeat(26), 'ABCDEFGHIJKLMNOPQRSTUVWXY1', 'ABCDEFGHIJKLMNOPQRSTUVWXYſ'])('rejects an invalid alphabet %s', (alphabet) => {
    expect(() => substitute('text', alphabet, 'encrypt')).toThrow('each A-Z letter exactly once');
  });
});
