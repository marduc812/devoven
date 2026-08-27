import { buildSquare, encodePolybius, decodePolybius, isPolybiusEncoded, renderSquare, processPolybius } from '@/Components/Functions/PolybiusCipherTools/logic';

const defaultSquare = buildSquare('');

describe('buildSquare', () => {
  it('has 25 letters without keyword', () => {
    expect(defaultSquare).toHaveLength(25);
  });
  it('starts with A when no keyword', () => {
    expect(defaultSquare[0]).toBe('A');
  });
  it('keyword letters come first', () => {
    const sq = buildSquare('KEY');
    expect(sq.startsWith('KEY')).toBe(true);
  });
  it('no duplicates in square', () => {
    const sq = buildSquare('KEYWORD');
    expect(new Set(sq.split('')).size).toBe(sq.length);
  });
  it('J is replaced by I', () => {
    expect(buildSquare('').includes('J')).toBe(false);
  });
});

describe('encodePolybius', () => {
  it('encodes A as 11', () => {
    expect(encodePolybius('A', defaultSquare)).toBe('11');
  });
  it('encodes B as 12', () => {
    expect(encodePolybius('B', defaultSquare)).toBe('12');
  });
  it('encodes J as I position', () => {
    const encJ = encodePolybius('J', defaultSquare);
    const encI = encodePolybius('I', defaultSquare);
    expect(encJ).toBe(encI);
  });
  it('preserves non-alpha with space separation', () => {
    const r = encodePolybius('A!', defaultSquare);
    expect(r).toContain('!');
  });
});

describe('decodePolybius', () => {
  it('decodes 11 to A', () => {
    expect(decodePolybius('11', defaultSquare)).toBe('A');
  });
  it('round-trips encode/decode', () => {
    const enc = encodePolybius('HELLO', defaultSquare);
    const dec = decodePolybius(enc, defaultSquare);
    expect(dec).toBe('HELLO');
  });
});

describe('isPolybiusEncoded', () => {
  it('detects number pairs', () => {
    expect(isPolybiusEncoded('11 12 13')).toBe(true);
  });
  it('returns false for plain text', () => {
    expect(isPolybiusEncoded('Hello World')).toBe(false);
  });
});

describe('processPolybius', () => {
  it('encodes text', () => {
    const r = processPolybius('HELLO', '');
    expect(r).toContain('Encode');
    expect(r).toContain('Polybius Square');
  });
  it('decodes number pairs', () => {
    const r = processPolybius('11 12', '');
    expect(r).toContain('Decode');
  });
  it('returns empty for empty input', () => {
    expect(processPolybius('', '')).toBe('');
  });
});
