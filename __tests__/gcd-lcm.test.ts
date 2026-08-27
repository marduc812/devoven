import {
  gcd,
  lcm,
  gcdMultiple,
  lcmMultiple,
  primeFactors,
  formatFactorization,
  divisorsOf,
  euclidSteps,
  parseNumberList,
  analyzeGcdLcm,
} from '@/Components/Functions/GcdLcmTools/logic';
describe('gcd', () => {
  it('gcd(12, 8) = 4', () => expect(gcd(12, 8)).toBe(4));
  it('gcd(7, 5) = 1', () => expect(gcd(7, 5)).toBe(1));
  it('gcd(0, 5) = 5', () => expect(gcd(0, 5)).toBe(5));
  it('gcd(100, 75) = 25', () => expect(gcd(100, 75)).toBe(25));
});
describe('lcm', () => {
  it('lcm(4, 6) = 12', () => expect(lcm(4, 6)).toBe(12));
  it('lcm(7, 5) = 35', () => expect(lcm(7, 5)).toBe(35));
  it('lcm(0, 5) = 0', () => expect(lcm(0, 5)).toBe(0));
});
describe('gcdMultiple', () => {
  it('gcd of [12, 8, 4] = 4', () => expect(gcdMultiple([12, 8, 4])).toBe(4));
});
describe('lcmMultiple', () => {
  it('lcm of [4, 6, 10] = 60', () => expect(lcmMultiple([4, 6, 10])).toBe(60));
});
describe('primeFactors', () => {
  it('factors 180', () => {
    expect(primeFactors(180)).toEqual([
      { prime: 2, exponent: 2 },
      { prime: 3, exponent: 2 },
      { prime: 5, exponent: 1 },
    ]);
  });
  it('returns nothing for 1', () => expect(primeFactors(1)).toEqual([]));
  it('keeps a large prime whole', () =>
    expect(primeFactors(9973)).toEqual([{ prime: 9973, exponent: 1 }]));
});

describe('formatFactorization', () => {
  it('renders exponents', () =>
    expect(formatFactorization(primeFactors(48))).toBe('2^4 × 3'));
  it('calls the empty product 1', () => expect(formatFactorization([])).toBe('1'));
});

describe('divisorsOf', () => {
  it('lists divisors ascending', () => expect(divisorsOf(12)).toEqual([1, 2, 3, 4, 6, 12]));
  it('does not repeat the square root', () => expect(divisorsOf(16)).toEqual([1, 2, 4, 8, 16]));
});

describe('euclidSteps', () => {
  it('ends on remainder 0', () => {
    const steps = euclidSteps(1071, 462);
    expect(steps[steps.length - 1].remainder).toBe(0);
    expect(steps[steps.length - 1].b).toBe(21);
  });
});

describe('parseNumberList', () => {
  it('splits on commas and spaces', () => expect(parseNumberList('12, 8  4')).toEqual([12, 8, 4]));
  it('rejects a single number', () => expect(() => parseNumberList('12')).toThrow());
  it('rejects zero', () => expect(() => parseNumberList('12 0')).toThrow());
});

describe('analyzeGcdLcm', () => {
  it('reads the GCD off the minimum exponents', () => {
    const r = analyzeGcdLcm('48 180');
    expect(r.gcd).toBe(12);
    expect(r.lcm).toBe(720);
    expect(r.primes).toEqual([2, 3, 5]);
    expect(r.gcdExponents).toEqual([2, 1, 0]);
    expect(r.lcmExponents).toEqual([4, 2, 1]);
  });
  it('flags a coprime pair', () => {
    const r = analyzeGcdLcm('17 23');
    expect(r.coprime).toBe(true);
    expect(r.commonDivisors).toEqual([1]);
    expect(r.factorizations.every(f => f.isPrime)).toBe(true);
  });
  it('reduces a pair to lowest terms', () => {
    expect(analyzeGcdLcm('12 8').reduced).toEqual([3, 2]);
  });
  it('gives no Euclid steps for three numbers', () => {
    expect(analyzeGcdLcm('4 6 10').steps).toEqual([]);
  });
  it('keeps the LCM exact where a * b would not be', () => {
    // 1691258160 * 4284520672 exceeds 2^53, so dividing the product by the GCD
    // afterwards lands on 64267810079.99999.
    const r = analyzeGcdLcm('1691258160 4284520672');
    expect(r.lcm).toBe(64267810080);
    expect(r.lcmExact).toBe(true);
  });
  it('says so when the LCM leaves the exact integer range', () => {
    expect(analyzeGcdLcm('99999989 99999971').lcmExact).toBe(false);
  });
});
