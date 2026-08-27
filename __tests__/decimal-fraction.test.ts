import { gcd, decimalToFraction, continuedFraction, formatFractionResult } from '../Components/Functions/DecimalToFractionTools/logic';

describe('gcd', () => {
  it('computes GCD of two numbers', () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(100, 75)).toBe(25);
    expect(gcd(7, 3)).toBe(1);
  });

  it('handles zero', () => {
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(5, 0)).toBe(5);
  });

  it('handles same numbers', () => {
    expect(gcd(6, 6)).toBe(6);
  });

  it('handles negative numbers', () => {
    expect(gcd(-12, 8)).toBe(4);
  });
});

describe('decimalToFraction', () => {
  it('converts 0.5 to 1/2', () => {
    const r = decimalToFraction('0.5');
    expect(r.numerator).toBe(1);
    expect(r.denominator).toBe(2);
    expect(r.simplified).toBe('1/2');
  });

  it('converts 0.25 to 1/4', () => {
    const r = decimalToFraction('0.25');
    expect(r.numerator).toBe(1);
    expect(r.denominator).toBe(4);
  });

  it('converts 1.0 (integer) to 1/1', () => {
    const r = decimalToFraction('1');
    expect(r.numerator).toBe(1);
    expect(r.denominator).toBe(1);
    expect(r.simplified).toBe('1');
  });

  it('converts 0.333... to 1/3', () => {
    const r = decimalToFraction('0.333333333333');
    expect(r.numerator).toBe(1);
    expect(r.denominator).toBe(3);
    expect(r.isRepeating).toBe(true);
  });

  it('converts negative decimal', () => {
    const r = decimalToFraction('-0.5');
    expect(r.numerator).toBe(-1);
    expect(r.denominator).toBe(2);
  });

  it('includes percentage', () => {
    const r = decimalToFraction('0.5');
    expect(r.percentage).toBe('50%');
  });

  it('includes ratio', () => {
    const r = decimalToFraction('0.5');
    expect(r.ratio).toBe('1:2');
  });

  it('includes continued fraction', () => {
    const r = decimalToFraction('0.5');
    expect(r.continuedFraction).toEqual([0, 2]);
  });

  it('throws on empty input', () => {
    expect(() => decimalToFraction('')).toThrow();
  });

  it('throws on non-numeric input', () => {
    expect(() => decimalToFraction('abc')).toThrow();
  });

  it('converts 0.75 to 3/4', () => {
    const r = decimalToFraction('0.75');
    expect(r.numerator).toBe(3);
    expect(r.denominator).toBe(4);
  });

  it('converts 2.5 to 5/2', () => {
    const r = decimalToFraction('2.5');
    expect(r.numerator).toBe(5);
    expect(r.denominator).toBe(2);
  });
});

describe('continuedFraction', () => {
  it('computes CF for 0.5', () => {
    expect(continuedFraction(0.5)).toEqual([0, 2]);
  });

  it('computes CF for integers', () => {
    expect(continuedFraction(3)).toEqual([3]);
  });

  it('computes CF for golden ratio approximation', () => {
    const cf = continuedFraction(1.618033988);
    expect(cf[0]).toBe(1);
    expect(cf[1]).toBe(1);
  });
});

describe('formatFractionResult', () => {
  it('includes all expected fields', () => {
    const r = decimalToFraction('0.5');
    const formatted = formatFractionResult(r);
    expect(formatted).toContain('Fraction:');
    expect(formatted).toContain('Numerator:');
    expect(formatted).toContain('Denominator:');
    expect(formatted).toContain('Percentage:');
    expect(formatted).toContain('Ratio:');
    expect(formatted).toContain('Continued Fraction:');
  });

  it('notes repeating decimal', () => {
    const r = decimalToFraction('0.333333333333');
    const formatted = formatFractionResult(r);
    expect(formatted).toContain('Repeating');
  });
});
