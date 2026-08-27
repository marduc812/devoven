import {
  toRoman,
  fromRoman,
  romanCalculate,
} from '@/Components/Functions/RomanCalculatorTools/logic';

describe('toRoman', () => {
  it('converts 1 to I', () => expect(toRoman(1)).toBe('I'));
  it('converts 4 to IV', () => expect(toRoman(4)).toBe('IV'));
  it('converts 9 to IX', () => expect(toRoman(9)).toBe('IX'));
  it('converts 14 to XIV', () => expect(toRoman(14)).toBe('XIV'));
  it('converts 40 to XL', () => expect(toRoman(40)).toBe('XL'));
  it('converts 1999 to MCMXCIX', () => expect(toRoman(1999)).toBe('MCMXCIX'));
  it('converts 3999 to MMMCMXCIX', () => expect(toRoman(3999)).toBe('MMMCMXCIX'));
  it('throws for 0', () => expect(() => toRoman(0)).toThrow());
  it('throws for 4000', () => expect(() => toRoman(4000)).toThrow());
  it('throws for negative', () => expect(() => toRoman(-1)).toThrow());
  it('throws for non-integer', () => expect(() => toRoman(2.5)).toThrow());
});

describe('fromRoman', () => {
  it('converts I to 1', () => expect(fromRoman('I')).toBe(1));
  it('converts XIV to 14', () => expect(fromRoman('XIV')).toBe(14));
  it('converts VI to 6', () => expect(fromRoman('VI')).toBe(6));
  it('converts MCMXCIX to 1999', () => expect(fromRoman('MCMXCIX')).toBe(1999));
  it('handles lowercase', () => expect(fromRoman('xiv')).toBe(14));
  it('handles whitespace', () => expect(fromRoman(' XIV ')).toBe(14));
  it('throws for invalid character', () => expect(() => fromRoman('ABC')).toThrow());
});

describe('romanCalculate', () => {
  it('adds XIV + VI = 20 = XX', () => {
    const result = romanCalculate('XIV + VI');
    expect(result).toContain('XX');
    expect(result).toContain('20');
  });
  it('subtracts X - III = 7 = VII', () => {
    const result = romanCalculate('X - III');
    expect(result).toContain('VII');
    expect(result).toContain('7');
  });
  it('multiplies III * IV = 12 = XII', () => {
    const result = romanCalculate('III * IV');
    expect(result).toContain('XII');
    expect(result).toContain('12');
  });
  it('divides XX / IV = 5 = V', () => {
    const result = romanCalculate('XX / IV');
    expect(result).toContain('V');
    expect(result).toContain('5');
  });
  it('throws for invalid format', () => expect(() => romanCalculate('hello')).toThrow());
  it('throws for out-of-range result', () => expect(() => romanCalculate('MM + MM')).toThrow());
  it('throws when result is 0 or negative (X - X)', () => {
    expect(() => romanCalculate('X - X')).toThrow();
  });
});
