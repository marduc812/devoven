import { atbashLatin, atbashHebrew, atbash, getSubstitutionTable, processAtbash } from '@/Components/Functions/AtbashCipherTools/logic';

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

describe('getSubstitutionTable', () => {
  it('returns two lines', () => {
    const table = getSubstitutionTable();
    expect(table.split('\n')).toHaveLength(2);
  });
  it('plain line has 26 chars after prefix', () => {
    const table = getSubstitutionTable();
    const line = table.split('\n')[0];
    expect(line).toContain('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });
  it('cipher line starts with Z (A->Z)', () => {
    const table = getSubstitutionTable();
    const line = table.split('\n')[1];
    expect(line).toContain('ZYXWVUTSRQPONMLKJIHGFEDCBA');
  });
});

describe('processAtbash', () => {
  it('returns result and table', () => {
    const r = processAtbash('Hello', false);
    expect(r).toContain('---');
    expect(r).toContain('Svool');
  });
  it('returns empty for empty input', () => {
    expect(processAtbash('', false)).toBe('');
  });
});
