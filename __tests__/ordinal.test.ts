import { toOrdinal, toOrdinalWords, convertOrdinals } from '@/Components/Functions/OrdinalTools/logic';

describe('toOrdinal', () => {
  it('1st', () => expect(toOrdinal(1)).toBe('1st'));
  it('2nd', () => expect(toOrdinal(2)).toBe('2nd'));
  it('3rd', () => expect(toOrdinal(3)).toBe('3rd'));
  it('4th', () => expect(toOrdinal(4)).toBe('4th'));
  it('11th (special case)', () => expect(toOrdinal(11)).toBe('11th'));
  it('12th (special case)', () => expect(toOrdinal(12)).toBe('12th'));
  it('13th (special case)', () => expect(toOrdinal(13)).toBe('13th'));
  it('21st', () => expect(toOrdinal(21)).toBe('21st'));
  it('22nd', () => expect(toOrdinal(22)).toBe('22nd'));
  it('101st', () => expect(toOrdinal(101)).toBe('101st'));
  it('111th', () => expect(toOrdinal(111)).toBe('111th'));
  it('negative', () => expect(toOrdinal(-1)).toBe('-1st'));
});

describe('toOrdinalWords', () => {
  it('first', () => expect(toOrdinalWords(1)).toBe('first'));
  it('second', () => expect(toOrdinalWords(2)).toBe('second'));
  it('third', () => expect(toOrdinalWords(3)).toBe('third'));
  it('twentieth', () => expect(toOrdinalWords(20)).toBe('twentieth'));
  it('twenty-first', () => expect(toOrdinalWords(21)).toBe('twenty-first'));
  it('zeroth', () => expect(toOrdinalWords(0)).toBe('zeroth'));
  it('twelfth', () => expect(toOrdinalWords(12)).toBe('twelfth'));
});

describe('convertOrdinals', () => {
  it('converts multiple numbers', () => {
    const r = convertOrdinals('1\n2\n3');
    expect(r).toContain('1st');
    expect(r).toContain('2nd');
    expect(r).toContain('3rd');
  });
  it('includes word form for small numbers', () => {
    expect(convertOrdinals('1')).toContain('first');
  });
});
