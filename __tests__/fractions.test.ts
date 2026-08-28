import { addFractions, subtractFractions, multiplyFractions, divideFractions, reduceFraction, calculateFraction } from '@/Components/Functions/FractionsTools/logic';

describe('reduceFraction', () => {
  it('reduces 4/8 to 1/2', () => {
    expect(reduceFraction({ num: 4, den: 8 })).toEqual({ num: 1, den: 2 });
  });
  it('handles negative numerator', () => {
    expect(reduceFraction({ num: -4, den: 8 })).toEqual({ num: -1, den: 2 });
  });
  it('normalizes negative denominator', () => {
    expect(reduceFraction({ num: 4, den: -8 })).toEqual({ num: -1, den: 2 });
  });
  it('throws on zero denominator', () => {
    expect(() => reduceFraction({ num: 1, den: 0 })).toThrow();
  });
});

describe('addFractions', () => {
  it('adds 1/2 + 1/3 = 5/6', () => {
    expect(addFractions({ num: 1, den: 2 }, { num: 1, den: 3 })).toEqual({ num: 5, den: 6 });
  });
  it('adds 3/4 + 1/4 = 1', () => {
    expect(addFractions({ num: 3, den: 4 }, { num: 1, den: 4 })).toEqual({ num: 1, den: 1 });
  });
});

describe('subtractFractions', () => {
  it('subtracts 3/4 - 1/4 = 1/2', () => {
    expect(subtractFractions({ num: 3, den: 4 }, { num: 1, den: 4 })).toEqual({ num: 1, den: 2 });
  });
});

describe('multiplyFractions', () => {
  it('multiplies 2/3 * 3/4 = 1/2', () => {
    expect(multiplyFractions({ num: 2, den: 3 }, { num: 3, den: 4 })).toEqual({ num: 1, den: 2 });
  });
});

describe('divideFractions', () => {
  it('divides 1/2 / 1/4 = 2', () => {
    expect(divideFractions({ num: 1, den: 2 }, { num: 1, den: 4 })).toEqual({ num: 2, den: 1 });
  });
  it('throws on division by zero fraction', () => {
    expect(() => divideFractions({ num: 1, den: 2 }, { num: 0, den: 4 })).toThrow();
  });
});

describe('calculateFraction', () => {
  it('returns empty on empty input', () => expect(calculateFraction('')).toBe(''));

  it('adds fractions', () => {
    const result = calculateFraction('3/4 + 1/4');
    expect(result).toContain('Result: 1');
  });

  it('subtracts fractions', () => {
    const result = calculateFraction('3/4 - 1/4');
    expect(result).toContain('Result: 1/2');
  });

  it('multiplies fractions', () => {
    const result = calculateFraction('2/3 * 3/4');
    expect(result).toContain('Result: 1/2');
  });

  it('divides fractions', () => {
    const result = calculateFraction('1/2 / 1/4');
    expect(result).toContain('Result: 2');
  });

  it('shows decimal result', () => {
    const result = calculateFraction('1/4 + 1/4');
    expect(result).toContain('Decimal: 0.5');
  });

  it('shows step-by-step for addition', () => {
    const result = calculateFraction('1/3 + 1/6');
    expect(result).toContain('LCD');
  });
});
