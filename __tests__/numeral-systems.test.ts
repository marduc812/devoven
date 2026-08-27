import { toRoman, numberToWords, toFraction, convertNumeral, getReferenceTable } from '../Components/Functions/NumeralSystemsTools/logic';

describe('toRoman', () => {
  it('converts 1 to I', () => expect(toRoman(1)).toBe('I'));
  it('converts 4 to IV', () => expect(toRoman(4)).toBe('IV'));
  it('converts 9 to IX', () => expect(toRoman(9)).toBe('IX'));
  it('converts 14 to XIV', () => expect(toRoman(14)).toBe('XIV'));
  it('converts 40 to XL', () => expect(toRoman(40)).toBe('XL'));
  it('converts 90 to XC', () => expect(toRoman(90)).toBe('XC'));
  it('converts 400 to CD', () => expect(toRoman(400)).toBe('CD'));
  it('converts 900 to CM', () => expect(toRoman(900)).toBe('CM'));
  it('converts 1994 to MCMXCIV', () => expect(toRoman(1994)).toBe('MCMXCIV'));
  it('converts 3999 to MMMCMXCIX', () => expect(toRoman(3999)).toBe('MMMCMXCIX'));
  it('returns N/A for 0', () => expect(toRoman(0)).toBe('N/A'));
  it('returns N/A for negative', () => expect(toRoman(-1)).toBe('N/A'));
  it('returns N/A for 4000', () => expect(toRoman(4000)).toBe('N/A'));
  it('returns N/A for floats', () => expect(toRoman(3.5)).toBe('N/A'));
});

describe('numberToWords', () => {
  it('converts 0', () => expect(numberToWords(0)).toBe('zero'));
  it('converts 1', () => expect(numberToWords(1)).toBe('one'));
  it('converts 12', () => expect(numberToWords(12)).toBe('twelve'));
  it('converts 100', () => expect(numberToWords(100)).toBe('one hundred'));
  it('converts 1000', () => expect(numberToWords(1000)).toBe('one thousand'));
  it('converts 1001', () => expect(numberToWords(1001)).toBe('one thousand, one'));
  it('converts negative', () => expect(numberToWords(-5)).toBe('negative five'));
  it('converts 21', () => expect(numberToWords(21)).toBe('twenty-one'));
});

describe('toFraction', () => {
  it('returns known fraction for 0.5', () => expect(toFraction(0.5)).toBe('1/2'));
  it('returns known fraction for 0.25', () => expect(toFraction(0.25)).toBe('1/4'));
  it('returns known fraction for 0.75', () => expect(toFraction(0.75)).toBe('3/4'));
  it('returns integer/1 for whole numbers', () => expect(toFraction(5)).toBe('5/1'));
  it('finds fraction for 0.1', () => {
    const f = toFraction(0.1);
    expect(f).toMatch(/^1\/10$|^\d+\/\d+$/);
  });
});

describe('convertNumeral', () => {
  it('returns null for empty string', () => {
    expect(convertNumeral('')).toBeNull();
  });

  it('converts 255 correctly', () => {
    const r = convertNumeral('255');
    expect(r).not.toBeNull();
    if (r) {
      expect(r.decimal).toBe('255');
      expect(r.binary).toBe('11111111');
      expect(r.octal).toBe('377');
      expect(r.hexadecimal).toBe('FF');
      expect(r.roman).toBe('CCLV');
      expect(r.scientific).toBe('2.55e+2');
    }
  });

  it('converts 0 correctly', () => {
    const r = convertNumeral('0');
    expect(r).not.toBeNull();
    if (r) {
      expect(r.decimal).toBe('0');
      expect(r.binary).toBe('0');
    }
  });

  it('returns null for non-numeric input', () => {
    expect(convertNumeral('abc')).toBeNull();
  });

  it('handles float input', () => {
    const r = convertNumeral('3.14');
    expect(r).not.toBeNull();
    if (r) {
      expect(r.decimal).toBe('3.14');
      expect(r.binary).toContain('N/A');
    }
  });
});

describe('getReferenceTable', () => {
  it('returns 256 rows starting from 0', () => {
    const rows = getReferenceTable(0, 256);
    expect(rows).toHaveLength(256);
    expect(rows[0].decimal).toBe(0);
    expect(rows[255].decimal).toBe(255);
  });

  it('row 65 has char A', () => {
    const rows = getReferenceTable(65, 1);
    expect(rows[0].char).toBe('A');
  });

  it('caps at 255', () => {
    const rows = getReferenceTable(250, 100);
    expect(rows[rows.length - 1].decimal).toBe(255);
  });

  it('formats binary as 8 bits padded', () => {
    const rows = getReferenceTable(1, 1);
    expect(rows[0].binary).toBe('00000001');
  });
});
