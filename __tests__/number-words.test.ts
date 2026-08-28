import { convertNumberWords, toOrdinal } from '@/Components/Functions/NumberWordsTools/logic';

describe('toOrdinal', () => {
  it('first', () => expect(toOrdinal('one')).toBe('first'));
  it('second', () => expect(toOrdinal('two')).toBe('second'));
  it('third', () => expect(toOrdinal('three')).toBe('third'));
  it('fourth', () => expect(toOrdinal('four')).toBe('fourth'));
  it('twelfth', () => expect(toOrdinal('twelve')).toBe('twelfth'));
  it('twentieth', () => expect(toOrdinal('twenty')).toBe('twentieth'));
  it('twenty-first', () => expect(toOrdinal('twenty-one')).toBe('twenty-first'));
  it('forty-second', () => expect(toOrdinal('forty-two')).toBe('forty-second'));
  it('thousandth', () => expect(toOrdinal('one thousand')).toBe('one thousandth'));
});

describe('convertNumberWords', () => {
  it('returns empty on empty input', () => expect(convertNumberWords('')).toBe(''));

  it('converts 0', () => expect(convertNumberWords('0')).toBe('zeroth'));

  it('converts 1', () => expect(convertNumberWords('1')).toBe('first'));

  it('converts 42', () => expect(convertNumberWords('42')).toBe('forty-second'));

  it('converts 1234', () =>
    expect(convertNumberWords('1234')).toBe('one thousand two hundred thirty-fourth'));

  it('converts negative numbers', () => expect(convertNumberWords('-5')).toBe('negative fifth'));

  it('throws on too large number', () => {
    expect(() => convertNumberWords('1000000000000001')).toThrow();
  });

  it('throws on non-integer', () => {
    expect(() => convertNumberWords('abc')).toThrow();
  });
});
