import { buildPlayfairSquare, playfairEncrypt, playfairDecrypt, playfairSquareDisplay, processPlayfair } from '@/Components/Functions/PlayfairCipherTools/logic';

describe('buildPlayfairSquare', () => {
  it('returns 25 characters', () => {
    expect(buildPlayfairSquare('PLAYFAIR').length).toBe(25);
  });

  it('does not contain J', () => {
    const sq = buildPlayfairSquare('PLAYFAIR');
    expect(sq.join('')).not.toContain('J');
  });

  it('starts with key letters (deduplicated)', () => {
    const sq = buildPlayfairSquare('PLAYFAIR');
    expect(sq[0]).toBe('P');
    expect(sq[1]).toBe('L');
  });

  it('all chars are unique', () => {
    const sq = buildPlayfairSquare('KEYWORD');
    expect(new Set(sq).size).toBe(25);
  });
});

describe('playfairEncrypt / playfairDecrypt', () => {
  it('throws on empty key', () => {
    expect(() => playfairEncrypt('HELLO', '')).toThrow();
    expect(() => playfairDecrypt('HELLO', '')).toThrow();
  });

  it('returns empty for empty text', () => {
    expect(playfairEncrypt('', 'KEY')).toBe('');
    expect(playfairDecrypt('', 'KEY')).toBe('');
  });

  it('output length is even', () => {
    const enc = playfairEncrypt('HELLO', 'PLAYFAIR');
    expect(enc.length % 2).toBe(0);
  });

  it('encrypt then decrypt round-trips', () => {
    const enc = playfairEncrypt('HELLO', 'PLAYFAIR');
    const dec = playfairDecrypt(enc, 'PLAYFAIR');
    // Decrypted may have padding X
    expect(dec.startsWith('HEL')).toBe(true);
  });

  it('I and J treated the same', () => {
    const encI = playfairEncrypt('I', 'KEY');
    const encJ = playfairEncrypt('J', 'KEY');
    expect(encI).toBe(encJ);
  });
});

describe('playfairSquareDisplay', () => {
  it('contains 5x5 header', () => {
    expect(playfairSquareDisplay('KEY')).toContain('5x5 Key Square');
  });
});

describe('processPlayfair', () => {
  it('returns empty for empty input', () => {
    expect(processPlayfair('', 'KEY', 'encrypt')).toBe('');
  });

  it('includes key square and steps in output', () => {
    const r = processPlayfair('HELLO', 'PLAYFAIR', 'encrypt');
    expect(r).toContain('5x5 Key Square');
    expect(r).toContain('Digraph steps');
  });
});
