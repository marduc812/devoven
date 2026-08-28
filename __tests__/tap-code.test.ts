import { tapEncode, tapDecode, tapGrid, processTapCode } from '@/Components/Functions/TapCodeTools/logic';

describe('tapEncode', () => {
  it('returns empty for empty input', () => {
    expect(tapEncode('')).toBe('');
  });

  it('encodes A as ". ."', () => {
    expect(tapEncode('A')).toBe('. .');
  });

  it('encodes B as ". .."', () => {
    expect(tapEncode('B')).toBe('. ..');
  });

  it('encodes Z (row 5, col 5) as "..... ....."', () => {
    expect(tapEncode('Z')).toBe('..... .....');
  });

  it('encodes K as C (row 1, col 3)', () => {
    expect(tapEncode('K')).toBe(tapEncode('C'));
  });

  it('encodes multiple letters separated by /', () => {
    const result = tapEncode('AB');
    expect(result).toContain('/');
  });

  it('ignores non-alpha characters', () => {
    expect(tapEncode('A1B')).toBe(tapEncode('AB'));
  });
});

describe('tapDecode', () => {
  it('returns empty for empty input', () => {
    expect(tapDecode('')).toBe('');
  });

  it('decodes ". ." as A', () => {
    expect(tapDecode('. .')).toBe('A');
  });

  it('decodes ". .." as B', () => {
    expect(tapDecode('. ..')).toBe('B');
  });

  it('round-trips encode/decode', () => {
    const encoded = tapEncode('HELLO');
    const decoded = tapDecode(encoded);
    expect(decoded).toBe('HELLO');
    expect(decoded.length).toBe(5);
  });
});

describe('tapGrid', () => {
  it('contains header', () => {
    expect(tapGrid()).toContain('Tap Code Grid');
  });

  it('mentions K maps to C', () => {
    expect(tapGrid()).toContain('K uses C');
  });
});

describe('processTapCode', () => {
  it('returns empty for empty input', () => {
    expect(processTapCode('', 'encode')).toBe('');
  });

  it('includes grid in output', () => {
    const r = processTapCode('HELLO', 'encode');
    expect(r).toContain('---');
    expect(r).toContain('Tap Code Grid');
  });
});
