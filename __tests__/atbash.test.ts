import { atbashLatin, atbashHebrew, atbash, processAtbash } from '@/Components/Functions/AtbashCipherTools/logic';

describe('atbashLatin', () => {
  it('A becomes Z', () => expect(atbashLatin('A')).toBe('Z'));
  it('Z becomes A', () => expect(atbashLatin('Z')).toBe('A'));
  it('B becomes Y', () => expect(atbashLatin('B')).toBe('Y'));
  it('lowercase a becomes z', () => expect(atbashLatin('a')).toBe('z'));
  it('preserves non-alpha', () => expect(atbashLatin('A!')).toBe('Z!'));
  it('is its own inverse', () => expect(atbashLatin(atbashLatin('Hello World'))).toBe('Hello World'));
  it('HELLO becomes SVOOL', () => expect(atbashLatin('HELLO')).toBe('SVOOL'));
});

describe('atbashHebrew', () => {
  it('aleph becomes tav', () => {
    const aleph = '\u05D0';
    const tav = '\u05EA';
    expect(atbashHebrew(aleph)).toBe(tav);
  });
  it('is its own inverse', () => {
    const text = '\u05D0\u05D1\u05D2';
    expect(atbashHebrew(atbashHebrew(text))).toBe(text);
  });
  it('preserves latin letters', () => {
    expect(atbashHebrew('ABC')).toBe('ABC');
  });
});

describe('atbash', () => {
  it('applies latin atbash', () => {
    expect(atbash('Hello', false)).toContain('S');
  });
  it('applies both when includeHebrew is true', () => {
    const text = 'A\u05D0';
    const result = atbash(text, true);
    expect(result[0]).toBe('Z');
  });
  it('returns empty for empty input', () => {
    expect(atbash('', false)).toBe('');
  });
});

describe('processAtbash', () => {
  it('returns only the ciphered text', () => {
    expect(processAtbash('Hello', false)).toBe('Svool');
  });
  it('is its own inverse', () => {
    expect(processAtbash(processAtbash('Hello World', false), false)).toBe('Hello World');
  });
  it('returns empty for empty input', () => {
    expect(processAtbash('', false)).toBe('');
  });
});
