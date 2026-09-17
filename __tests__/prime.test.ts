import { isPrime, primeFactors, nextPrime, previousPrime, sieveOfEratosthenes, countPrimesUpTo, divisorsOf, groupFactors, formatFactorization, analyzePrime, analyzePrimeResult } from '@/Components/Functions/PrimeTools/logic';
describe('isPrime', () => {
  it('2 is prime', () => expect(isPrime(2)).toBe(true));
  it('3 is prime', () => expect(isPrime(3)).toBe(true));
  it('4 is not prime', () => expect(isPrime(4)).toBe(false));
  it('17 is prime', () => expect(isPrime(17)).toBe(true));
  it('1 is not prime', () => expect(isPrime(1)).toBe(false));
  it('0 is not prime', () => expect(isPrime(0)).toBe(false));
  it('large prime 7919 is prime', () => expect(isPrime(7919)).toBe(true));
});
describe('primeFactors', () => {
  it('factors of 12 are [2,2,3]', () => expect(primeFactors(12)).toEqual([2,2,3]));
  it('factors of prime 7 are [7]', () => expect(primeFactors(7)).toEqual([7]));
  it('factors of 1 are []', () => expect(primeFactors(1)).toEqual([]));
});
describe('nextPrime', () => {
  it('next prime after 10 is 11', () => expect(nextPrime(10)).toBe(11));
  it('next prime after 13 is 17', () => expect(nextPrime(13)).toBe(17));
});
describe('sieveOfEratosthenes', () => {
  it('primes up to 10 are [2,3,5,7]', () => expect(sieveOfEratosthenes(10)).toEqual([2,3,5,7]));
  it('returns empty for limit < 2', () => expect(sieveOfEratosthenes(1)).toEqual([]));
});
describe('analyzePrime', () => {
  it('shows Yes for prime', () => expect(analyzePrime('7')).toContain('Yes ✓'));
  it('shows No for composite', () => expect(analyzePrime('12')).toContain('No ✗'));
  it('includes prime factors', () => expect(analyzePrime('12')).toContain('2'));
  it('throws for non-integer', () => expect(() => analyzePrime('abc')).toThrow());
});
describe('previousPrime', () => {
  it('previous prime before 10 is 7', () => expect(previousPrime(10)).toBe(7));
  it('previous prime before 3 is 2', () => expect(previousPrime(3)).toBe(2));
  it('returns null below 2', () => expect(previousPrime(2)).toBeNull());
});
describe('countPrimesUpTo', () => {
  it('matches the sieve for 100', () => expect(countPrimesUpTo(100)).toBe(sieveOfEratosthenes(100).length));
  it('pi(10) is 4', () => expect(countPrimesUpTo(10)).toBe(4));
  it('returns 0 below 2', () => expect(countPrimesUpTo(1)).toBe(0));
});
describe('divisorsOf', () => {
  it('divisors of 12', () => expect(divisorsOf(12)).toEqual([1, 2, 3, 4, 6, 12]));
  it('divisors of a prime', () => expect(divisorsOf(13)).toEqual([1, 13]));
  it('divisors of 1', () => expect(divisorsOf(1)).toEqual([1]));
  it('divisors of a perfect square', () => expect(divisorsOf(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]));
});
describe('groupFactors / formatFactorization', () => {
  it('groups repeats into exponents', () => expect(groupFactors([2, 2, 3])).toEqual([{ base: 2, exponent: 2 }, { base: 3, exponent: 1 }]));
  it('renders exponents', () => expect(formatFactorization(groupFactors(primeFactors(360)))).toBe('2^3 × 3^2 × 5'));
});
describe('analyzePrimeResult', () => {
  it('flags a prime', () => expect(analyzePrimeResult('97').isPrime).toBe(true));
  it('flags a composite', () => expect(analyzePrimeResult('12').isPrime).toBe(false));
  it('lists divisors of a composite', () => expect(analyzePrimeResult('12').divisors).toEqual([1, 2, 3, 4, 6, 12]));
  it('detects twin primes', () => expect(analyzePrimeResult('11').twinPrime).toBe(13));
  it('has no twin for an isolated prime', () => expect(analyzePrimeResult('23').twinPrime).toBeNull());
  it('classifies 6 as perfect', () => expect(analyzePrimeResult('6').divisorClass).toBe('perfect'));
  it('classifies 12 as abundant', () => expect(analyzePrimeResult('12').divisorClass).toBe('abundant'));
  it('classifies 8 as deficient', () => expect(analyzePrimeResult('8').divisorClass).toBe('deficient'));
  it('counts primes up to n', () => expect(analyzePrimeResult('100').primeCount).toBe(25));
  it('omits the prime grid for large n', () => expect(analyzePrimeResult('50000').primesUpTo).toBeNull());
  it('still counts primes when the grid is omitted', () => expect(analyzePrimeResult('50000').primeCount).toBe(5133));
  it('reports neighbouring primes', () => {
    const r = analyzePrimeResult('100');
    expect(r.nextPrime).toBe(101);
    expect(r.previousPrime).toBe(97);
  });
  it('throws for non-integer', () => expect(() => analyzePrimeResult('abc')).toThrow());
  it('throws for negatives', () => expect(() => analyzePrimeResult('-5')).toThrow());
  it('throws for unreasonably large input', () => expect(() => analyzePrimeResult('999999999999999')).toThrow());
});

import {
  bigPrimality,
  parseBigInput,
  analyzeBigPrime,
  DETERMINISTIC_LIMIT,
} from '@/Components/Functions/PrimeTools/logic';

describe('bigPrimality', () => {
  it('rejects everything below 2', () => {
    expect(bigPrimality(0n)).toBe('composite');
    expect(bigPrimality(1n)).toBe('composite');
  });

  it('agrees with trial division on small numbers', () => {
    const primesUnder50 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    for (let n = 0; n < 50; n++) {
      const expected = primesUnder50.includes(n) ? 'prime' : 'composite';
      expect(bigPrimality(BigInt(n))).toBe(expected);
    }
  });

  it('catches the Carmichael numbers that fool a Fermat test', () => {
    for (const n of [561n, 1105n, 1729n, 2465n, 2821n, 6601n, 8911n]) {
      expect(bigPrimality(n)).toBe('composite');
    }
  });

  it('handles a 39-digit Mersenne prime', () => {
    expect(bigPrimality(2n ** 127n - 1n)).toBe('probably prime');
  });

  it('factors a semiprime of two large primes as composite', () => {
    expect(bigPrimality(1000000007n * 1000000009n)).toBe('composite');
  });

  it('calls it proven below the deterministic limit and probable above it', () => {
    expect(bigPrimality(999999999989n)).toBe('prime');
    expect(DETERMINISTIC_LIMIT).toBeGreaterThan(10n ** 24n);
    expect(bigPrimality(10n ** 30n + 57n)).toBe('probably prime');
  });
});

describe('parseBigInput', () => {
  it('strips separators', () => expect(parseBigInput(' 1,000 000_7 ')).toBe(10000007n));
  it('rejects anything but digits', () => {
    expect(() => parseBigInput('-5')).toThrow();
    expect(() => parseBigInput('1e9')).toThrow();
    expect(() => parseBigInput('')).toThrow();
  });
});

describe('analyzeBigPrime', () => {
  it('counts digits and finds the next prime', () => {
    const result = analyzeBigPrime(100n);
    expect(result.digits).toBe(3);
    expect(result.primality).toBe('composite');
    expect(result.nextProbablePrime).toBe(101n);
  });

  it('steps past an even start', () => {
    expect(analyzeBigPrime(7n).nextProbablePrime).toBe(11n);
  });
});
