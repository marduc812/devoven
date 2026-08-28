import { buildSquare, standardSquare, fourSquareEncrypt, fourSquareDecrypt, fourSquareDisplay, processFourSquare } from '@/Components/Functions/FourSquareCipherTools/logic';

describe('buildSquare', () => {
  it('returns 25 characters', () => {
    expect(buildSquare('EXAMPLE').length).toBe(25);
  });

  it('all chars unique', () => {
    const sq = buildSquare('KEYWORD');
    expect(new Set(sq).size).toBe(25);
  });

  it('does not contain J', () => {
    expect(buildSquare('JUMP').join('')).not.toContain('J');
  });

  it('starts with key letters', () => {
    const sq = buildSquare('EXAMPLE');
    expect(sq[0]).toBe('E');
  });
});

describe('standardSquare', () => {
  it('has 25 chars', () => {
    expect(standardSquare().length).toBe(25);
  });

  it('starts with A', () => {
    expect(standardSquare()[0]).toBe('A');
  });

  it('does not contain J', () => {
    expect(standardSquare().join('')).not.toContain('J');
  });
});

describe('fourSquareEncrypt / fourSquareDecrypt', () => {
  it('throws on empty keys', () => {
    expect(() => fourSquareEncrypt('HELLO', '', 'KEYWORD')).toThrow();
    expect(() => fourSquareEncrypt('HELLO', 'EXAMPLE', '')).toThrow();
  });

  it('returns empty for empty text', () => {
    expect(fourSquareEncrypt('', 'EXAMPLE', 'KEYWORD')).toBe('');
    expect(fourSquareDecrypt('', 'EXAMPLE', 'KEYWORD')).toBe('');
  });

  it('output is all uppercase letters', () => {
    const enc = fourSquareEncrypt('HELLO', 'EXAMPLE', 'KEYWORD');
    expect(/^[A-Z]+$/.test(enc)).toBe(true);
  });

  it('output has even length', () => {
    const enc = fourSquareEncrypt('HELLO', 'EXAMPLE', 'KEYWORD');
    expect(enc.length % 2).toBe(0);
  });

  it('encrypt then decrypt round-trips', () => {
    const enc = fourSquareEncrypt('HELPME', 'EXAMPLE', 'KEYWORD');
    const dec = fourSquareDecrypt(enc, 'EXAMPLE', 'KEYWORD');
    expect(dec).toBe('HELPME');
  });
});

describe('fourSquareDisplay', () => {
  it('contains layout description', () => {
    expect(fourSquareDisplay('EXAMPLE', 'KEYWORD')).toContain('Four Squares Layout');
  });
});

describe('processFourSquare', () => {
  it('returns empty for empty input', () => {
    expect(processFourSquare('', 'EXAMPLE', 'KEYWORD', 'encrypt')).toBe('');
  });

  it('includes squares display', () => {
    const r = processFourSquare('HELLO', 'EXAMPLE', 'KEYWORD', 'encrypt');
    expect(r).toContain('---');
    expect(r).toContain('Four Squares Layout');
  });
});
