import {
  primeFactorize,
  getDivisors,
  analyzeFactorization,
  factorExpression,
  isPrimeFactorization,
  superscript,
} from '@/Components/Functions/PrimeFactorsTools/logic';

describe('primeFactorize', () => {
  it('returns empty for n < 2', () => {
    expect(primeFactorize(1)).toEqual([]);
    expect(primeFactorize(0)).toEqual([]);
  });

  it('factorizes a prime', () => {
    expect(primeFactorize(7)).toEqual([{ base: 7, exp: 1 }]);
    expect(primeFactorize(13)).toEqual([{ base: 13, exp: 1 }]);
  });

  it('factorizes composite numbers', () => {
    expect(primeFactorize(12)).toEqual([{ base: 2, exp: 2 }, { base: 3, exp: 1 }]);
    expect(primeFactorize(360)).toEqual([{ base: 2, exp: 3 }, { base: 3, exp: 2 }, { base: 5, exp: 1 }]);
  });

  it('factorizes perfect squares', () => {
    expect(primeFactorize(36)).toEqual([{ base: 2, exp: 2 }, { base: 3, exp: 2 }]);
  });
});

describe('getDivisors', () => {
  it('returns [1] for n=1', () => {
    expect(getDivisors(1)).toEqual([1]);
  });

  it('returns correct divisors for 12', () => {
    expect(getDivisors(12)).toEqual([1, 2, 3, 4, 6, 12]);
  });

  it('returns sorted divisors for 28 (perfect)', () => {
    const divs = getDivisors(28);
    expect(divs).toEqual([1, 2, 4, 7, 14, 28]);
    const sumProper = divs.slice(0, -1).reduce((a, b) => a + b, 0);
    expect(sumProper).toBe(28); // perfect number
  });
});

// ─── analyzeFactorization (structured) ────────────────────────────────────────

describe('analyzeFactorization', () => {
  it('returns null for empty input', () => {
    expect(analyzeFactorization('')).toBeNull();
    expect(analyzeFactorization('   ')).toBeNull();
  });

  it('throws on invalid, zero, negative and oversized input', () => {
    expect(() => analyzeFactorization('abc')).toThrow('valid integer');
    expect(() => analyzeFactorization('0')).toThrow('greater than zero');
    expect(() => analyzeFactorization('-5')).toThrow('greater than zero');
    expect(() => analyzeFactorization('1000000000000000')).toThrow('too large');
  });

  it('factorizes a composite number', () => {
    const r = analyzeFactorization('360')!;
    expect(r.number).toBe(360);
    expect(r.factors).toEqual([
      { base: 2, exp: 3 },
      { base: 3, exp: 2 },
      { base: 5, exp: 1 },
    ]);
    expect(r.expression).toBe('2³ × 3² × 5');
    expect(r.numDivisors).toBe(24);
  });

  it('treats 1 as a unit with no factors', () => {
    const r = analyzeFactorization('1')!;
    expect(r.factors).toEqual([]);
    expect(r.expression).toBe('');
    expect(r.classification).toBe('none');
    expect(r.divisors).toEqual([1]);
  });

  it('marks a prime as a single factor with exponent 1', () => {
    const r = analyzeFactorization('9973')!;
    expect(r.factors).toEqual([{ base: 9973, exp: 1 }]);
    expect(isPrimeFactorization(r.factors)).toBe(true);
    expect(r.numDivisors).toBe(2);
  });

  it('classifies perfect, abundant and deficient numbers', () => {
    expect(analyzeFactorization('6')!.classification).toBe('perfect');
    expect(analyzeFactorization('496')!.classification).toBe('perfect');
    expect(analyzeFactorization('12')!.classification).toBe('abundant');
    expect(analyzeFactorization('8')!.classification).toBe('deficient');
  });

  it('sums every divisor including n itself', () => {
    const r = analyzeFactorization('28')!;
    expect(r.divisors).toEqual([1, 2, 4, 7, 14, 28]);
    expect(r.sumDivisors).toBe(56);
    // proper divisor sum equals n for a perfect number
    expect(r.sumDivisors - r.number).toBe(28);
  });
});

// ─── factorExpression / isPrimeFactorization ──────────────────────────────────

describe('factorExpression', () => {
  it('renders exponents as superscripts and omits exponent 1', () => {
    expect(factorExpression([{ base: 2, exp: 10 }])).toBe('2¹⁰');
    expect(factorExpression([{ base: 7, exp: 1 }])).toBe('7');
    expect(factorExpression([])).toBe('');
  });
});

describe('isPrimeFactorization', () => {
  it('is true only for a single factor raised to the first power', () => {
    expect(isPrimeFactorization([{ base: 5, exp: 1 }])).toBe(true);
    expect(isPrimeFactorization([{ base: 5, exp: 2 }])).toBe(false);
    expect(isPrimeFactorization([])).toBe(false);
  });
});

describe('superscript', () => {
  it('maps every digit', () => {
    expect(superscript(1234567890)).toBe('¹²³⁴⁵⁶⁷⁸⁹⁰');
  });
});
