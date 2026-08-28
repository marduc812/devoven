import { extendedGcd, calculateExtendedGcd } from '@/Components/Functions/ExtendedGcdTools/logic';

describe('extendedGcd', () => {
  it('gcd of 35 and 15 is 5', () => {
    const { gcd, x, y } = extendedGcd(35, 15);
    expect(gcd).toBe(5);
    expect(35 * x + 15 * y).toBe(5);
  });

  it('gcd of 17 and 13 is 1 (coprime)', () => {
    const { gcd, x, y } = extendedGcd(17, 13);
    expect(gcd).toBe(1);
    expect(17 * x + 13 * y).toBe(1);
  });

  it('gcd of 0 and 5 is 5', () => {
    const { gcd } = extendedGcd(0, 5);
    expect(gcd).toBe(5);
  });

  it('gcd when b=0 returns a', () => {
    const { gcd, x, y } = extendedGcd(7, 0);
    expect(gcd).toBe(7);
    expect(x).toBe(1);
    expect(y).toBe(0);
  });
});

describe('calculateExtendedGcd', () => {
  it('throws on single input', () => {
    expect(() => calculateExtendedGcd('5')).toThrow();
  });

  it('throws when both zero', () => {
    expect(() => calculateExtendedGcd('0 0')).toThrow();
  });

  it('produces output for 35, 15', () => {
    const result = calculateExtendedGcd('35 15');
    expect(result).toContain('GCD(35, 15) = 5');
    expect(result).toContain('Bézout coefficients');
  });

  it('shows modular inverse for coprime', () => {
    const result = calculateExtendedGcd('3 7');
    expect(result).toContain('GCD(3, 7) = 1');
    expect(result).toContain('inverse');
  });

  it('shows no modular inverse when gcd > 1', () => {
    const result = calculateExtendedGcd('6 4');
    expect(result).toContain('No modular inverse');
  });
});
