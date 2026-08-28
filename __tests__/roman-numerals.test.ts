import { intToRoman, romanToInt, convertRoman, isRomanInput } from '@/Components/Functions/RomanNumeralsTools/logic';

describe('intToRoman', () => {
  it('converts 1 to I', () => expect(intToRoman(1)).toBe('I'));
  it('converts 4 to IV', () => expect(intToRoman(4)).toBe('IV'));
  it('converts 9 to IX', () => expect(intToRoman(9)).toBe('IX'));
  it('converts 14 to XIV', () => expect(intToRoman(14)).toBe('XIV'));
  it('converts 40 to XL', () => expect(intToRoman(40)).toBe('XL'));
  it('converts 90 to XC', () => expect(intToRoman(90)).toBe('XC'));
  it('converts 400 to CD', () => expect(intToRoman(400)).toBe('CD'));
  it('converts 900 to CM', () => expect(intToRoman(900)).toBe('CM'));
  it('converts 1994 to MCMXCIV', () => expect(intToRoman(1994)).toBe('MCMXCIV'));
  it('converts 3999 to MMMCMXCIX', () => expect(intToRoman(3999)).toBe('MMMCMXCIX'));
  it('throws for 0', () => expect(() => intToRoman(0)).toThrow());
  it('throws for 4000', () => expect(() => intToRoman(4000)).toThrow());
});

describe('romanToInt', () => {
  it('converts I to 1', () => expect(romanToInt('I')).toBe(1));
  it('converts IV to 4', () => expect(romanToInt('IV')).toBe(4));
  it('converts XIV to 14', () => expect(romanToInt('XIV')).toBe(14));
  it('converts MCMXCIV to 1994', () => expect(romanToInt('MCMXCIV')).toBe(1994));
  it('converts lowercase', () => expect(romanToInt('xiv')).toBe(14));
  it('throws on invalid chars', () => expect(() => romanToInt('ABC')).toThrow());
  it('throws on empty', () => expect(() => romanToInt('')).toThrow());
});

describe('isRomanInput', () => {
  it('detects Roman numeral input', () => {
    expect(isRomanInput('XIV')).toBe(true);
    expect(isRomanInput('MCMXCIV')).toBe(true);
  });
  it('detects integer input', () => {
    expect(isRomanInput('1994')).toBe(false);
    expect(isRomanInput('42')).toBe(false);
  });
});

describe('convertRoman', () => {
  it('returns empty on empty input', () => expect(convertRoman('')).toBe(''));

  it('converts integer to roman with steps', () => {
    const result = convertRoman('14');
    expect(result).toContain('Roman: XIV');
    expect(result).toContain('Arabic: 14');
  });

  it('converts roman to integer with breakdown', () => {
    const result = convertRoman('XIV');
    expect(result).toContain('Arabic: 14');
    expect(result).toContain('Roman: XIV');
  });

  it('includes reference table', () => {
    const result = convertRoman('5');
    expect(result).toContain('Reference table');
  });
});
