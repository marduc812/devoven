import {
  toDecimalString,
  fromDecimalString,
  convertBases,
  allBases,
  placeValues,
  digitSet,
  bitLength,
} from '@/Components/Functions/BaseConvertTools/logic';

describe('toDecimalString', () => {
  it('binary 1010 = 10', () => expect(toDecimalString('1010', 2)).toBe('10'));
  it('hex FF = 255', () => expect(toDecimalString('FF', 16)).toBe('255'));
  it('octal 17 = 15', () => expect(toDecimalString('17', 8)).toBe('15'));
  it('base36 Z = 35', () => expect(toDecimalString('Z', 36)).toBe('35'));
  it('throws invalid digit', () => expect(() => toDecimalString('2', 2)).toThrow());
  it('throws invalid base', () => expect(() => toDecimalString('1', 1)).toThrow());
  it('throws invalid base 37', () => expect(() => toDecimalString('1', 37)).toThrow());
  it('empty string throws', () => expect(() => toDecimalString('', 10)).toThrow());
});

describe('fromDecimalString', () => {
  it('10 to binary = 1010', () => expect(fromDecimalString('10', 2)).toBe('1010'));
  it('255 to hex = FF', () => expect(fromDecimalString('255', 16)).toBe('FF'));
  it('0 to any base = 0', () => expect(fromDecimalString('0', 16)).toBe('0'));
  it('throws invalid base', () => expect(() => fromDecimalString('10', 37)).toThrow());
});

describe('convertBases', () => {
  it('converts 255 decimal', () => {
    const r = convertBases('255', 10);
    expect(r.base2).toBe('11111111');
    expect(r.base8).toBe('377');
    expect(r.base16).toBe('FF');
    expect(r.base10).toBe('255');
  });
  it('converts binary 1010', () => {
    const r = convertBases('1010', 2);
    expect(r.base10).toBe('10');
    expect(r.base16).toBe('A');
  });
});

// ─── large values ─────────────────────────────────────────────────────────────
// The previous implementation multiplied with JS numbers, so anything past 2^53
// came back silently rounded.

describe('exactness beyond 2^53', () => {
  it('converts a full 64-bit hex value without rounding', () => {
    expect(toDecimalString('FFFFFFFFFFFFFFFF', 16)).toBe('18446744073709551615');
  });

  it('round-trips a 64-bit value back to hex', () => {
    expect(fromDecimalString('18446744073709551615', 16)).toBe('FFFFFFFFFFFFFFFF');
  });

  it('handles values far wider than 64 bits', () => {
    const hundredOnes = '1'.repeat(100);
    expect(toDecimalString(hundredOnes, 2)).toBe((BigInt('0b' + hundredOnes)).toString());
  });

  it('keeps 2^53 + 1 distinct from 2^53', () => {
    expect(toDecimalString('20000000000001', 16)).toBe('9007199254740993');
  });
});

// ─── signs and separators ─────────────────────────────────────────────────────

describe('sign and separator handling', () => {
  it('reads a negative number', () => expect(toDecimalString('-FF', 16)).toBe('-255'));
  it('reads a leading plus', () => expect(toDecimalString('+FF', 16)).toBe('255'));
  it('ignores spaces and underscores', () =>
    expect(toDecimalString('DE_AD BE_EF', 16)).toBe('3735928559'));
  it('does not render a negative zero', () => expect(toDecimalString('-0', 10)).toBe('0'));
  it('converts a negative decimal to another base', () =>
    expect(fromDecimalString('-255', 16)).toBe('-FF'));
});

// ─── allBases ─────────────────────────────────────────────────────────────────

describe('allBases', () => {
  it('returns one row per base from 2 to 36', () => {
    const rows = allBases('255');
    expect(rows).toHaveLength(35);
    expect(rows[0].base).toBe(2);
    expect(rows[rows.length - 1].base).toBe(36);
  });
  it('gives the right value for each base', () => {
    const rows = allBases('255');
    expect(rows.find(r => r.base === 2)!.value).toBe('11111111');
    expect(rows.find(r => r.base === 16)!.value).toBe('FF');
    expect(rows.find(r => r.base === 36)!.value).toBe('73');
  });
});

// ─── placeValues ──────────────────────────────────────────────────────────────

describe('placeValues', () => {
  it('breaks FF into its two place values', () => {
    const places = placeValues('FF', 16);
    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({ char: 'F', digit: 15, power: 1, contribution: '240' });
    expect(places[1]).toMatchObject({ char: 'F', digit: 15, power: 0, contribution: '15' });
  });

  it('contributions sum to the decimal value', () => {
    const places = placeValues('DEADBEEF', 16);
    const sum = places.reduce((acc, p) => acc + BigInt(p.contribution), BigInt(0));
    expect(sum.toString()).toBe(toDecimalString('DEADBEEF', 16));
  });

  it('returns an empty list for empty input', () => expect(placeValues('', 10)).toEqual([]));

  it('throws on a digit the base does not have', () =>
    expect(() => placeValues('2', 2)).toThrow());
});

// ─── digitSet ─────────────────────────────────────────────────────────────────

describe('digitSet', () => {
  it('describes base 2', () => expect(digitSet(2)).toBe('0-1'));
  it('describes base 10', () => expect(digitSet(10)).toBe('0-9'));
  it('describes base 16', () => expect(digitSet(16)).toBe('0-9, A-F'));
  it('describes base 36', () => expect(digitSet(36)).toBe('0-9, A-Z'));
});

// ─── bitLength ────────────────────────────────────────────────────────────────

describe('bitLength', () => {
  it('reports 1 bit for zero', () => expect(bitLength('0')).toBe(1));
  it('reports 8 bits for 255', () => expect(bitLength('255')).toBe(8));
  it('reports 9 bits for 256', () => expect(bitLength('256')).toBe(9));
  it('ignores the sign', () => expect(bitLength('-255')).toBe(8));
  it('reports 64 bits for the largest u64', () =>
    expect(bitLength('18446744073709551615')).toBe(64));
});
