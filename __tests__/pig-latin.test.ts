import { wordToPigLatin, toPigLatin } from '@/Components/Functions/PigLatinTools/logic';
describe('wordToPigLatin', () => {
  it('converts "pig" to "igpay"', () => expect(wordToPigLatin('pig')).toBe('igpay'));
  it('converts "latin" to "atinlay"', () => expect(wordToPigLatin('latin')).toBe('atinlay'));
  it('converts "banana" (starts with vowel) to "bananayay"', () => expect(wordToPigLatin('banana')).toBe('ananabay'));
  it('vowel words get yay suffix', () => expect(wordToPigLatin('apple')).toBe('appleyay'));
  it('preserves capitalization', () => expect(wordToPigLatin('Hello')).toMatch(/^[A-Z]/));
  it('handles numbers/non-alpha', () => expect(wordToPigLatin('123')).toBe('123'));
  it('handles empty string', () => expect(wordToPigLatin('')).toBe(''));
});
describe('toPigLatin', () => {
  it('converts a sentence', () => {
    const r = toPigLatin('hello world');
    expect(r).toContain('ellohay');
    expect(r).toContain('orldway');
  });
  it('preserves punctuation', () => expect(toPigLatin('hello!')).toContain('!'));
});
