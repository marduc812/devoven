import { analyzeNumber } from '@/Components/Functions/NumberTheoryTools/logic';

describe('analyzeNumber', () => {
  it('returns null for empty input', () => expect(analyzeNumber('')).toBeNull());
  it('returns null for zero', () => expect(analyzeNumber('0')).toBeNull());
  it('returns null for numbers > 1000000', () => expect(analyzeNumber('1000001')).toBeNull());
  it('returns null for non-numeric input', () => expect(analyzeNumber('abc')).toBeNull());

  describe('primality', () => {
    it('2 is prime', () => expect(analyzeNumber('2')!.isPrime).toBe(true));
    it('13 is prime', () => expect(analyzeNumber('13')!.isPrime).toBe(true));
    it('4 is not prime', () => expect(analyzeNumber('4')!.isPrime).toBe(false));
    it('1 is not prime', () => expect(analyzeNumber('1')!.isPrime).toBe(false));
  });

  describe('prime factorization', () => {
    it('12 = 2^2 * 3', () => {
      const r = analyzeNumber('12')!;
      expect(r.primeFactors).toContainEqual({ prime: 2, exponent: 2 });
      expect(r.primeFactors).toContainEqual({ prime: 3, exponent: 1 });
    });
    it('1 has no prime factors', () => expect(analyzeNumber('1')!.primeFactors).toHaveLength(0));
  });

  describe('Euler totient', () => {
    it('φ(1) = 1', () => expect(analyzeNumber('1')!.totient).toBe(1));
    it('φ(2) = 1', () => expect(analyzeNumber('2')!.totient).toBe(1));
    it('φ(12) = 4', () => expect(analyzeNumber('12')!.totient).toBe(4));
  });

  describe('divisors', () => {
    it('divisors of 6 are [1, 2, 3, 6]', () => {
      expect(analyzeNumber('6')!.divisors).toEqual([1, 2, 3, 6]);
    });
    it('divisors of 1 are [1]', () => {
      expect(analyzeNumber('1')!.divisors).toEqual([1]);
    });
  });

  describe('perfect/abundant/deficient', () => {
    it('6 is perfect', () => expect(analyzeNumber('6')!.classification).toBe('perfect'));
    it('12 is abundant', () => expect(analyzeNumber('12')!.classification).toBe('abundant'));
    it('8 is deficient', () => expect(analyzeNumber('8')!.classification).toBe('deficient'));
  });

  describe('Mobius function', () => {
    it('μ(1) = 1', () => expect(analyzeNumber('1')!.mobius).toBe(1));
    it('μ(2) = -1', () => expect(analyzeNumber('2')!.mobius).toBe(-1));
    it('μ(4) = 0 (squared factor)', () => expect(analyzeNumber('4')!.mobius).toBe(0));
    it('μ(6) = 1 (2 distinct primes)', () => expect(analyzeNumber('6')!.mobius).toBe(1));
  });

  describe('perfect square/cube', () => {
    it('9 is a perfect square', () => expect(analyzeNumber('9')!.isPerfectSquare).toBe(true));
    it('8 is a perfect cube', () => expect(analyzeNumber('8')!.isPerfectCube).toBe(true));
    it('10 is neither', () => {
      const r = analyzeNumber('10')!;
      expect(r.isPerfectSquare).toBe(false);
      expect(r.isPerfectCube).toBe(false);
    });
  });

  describe('digit sum and digital root', () => {
    it('digit sum of 123 = 6', () => expect(analyzeNumber('123')!.digitSum).toBe(6));
    it('digital root of 9999 = 9', () => expect(analyzeNumber('9999')!.digitalRoot).toBe(9));
    it('digital root of 10 = 1', () => expect(analyzeNumber('10')!.digitalRoot).toBe(1));
  });

  describe('Collatz sequence', () => {
    it('6 collatz sequence starts with 6', () => {
      expect(analyzeNumber('6')!.collatz[0]).toBe(6);
    });
    it('1 collatz sequence has length 1', () => {
      expect(analyzeNumber('1')!.collatzLength).toBe(1);
    });
    it('ends with 1 for short sequence', () => {
      // 6 has Collatz length 9, well within the 150-term cap
      const r = analyzeNumber('6')!;
      const seq = r.collatz;
      expect(seq[seq.length - 1]).toBe(1);
    });
  });

  describe('Carmichael numbers', () => {
    it('561 is a Carmichael number', () => expect(analyzeNumber('561')!.isCarmichael).toBe(true));
    it('6 is not a Carmichael number', () => expect(analyzeNumber('6')!.isCarmichael).toBe(false));
    it('prime 7 is not a Carmichael number', () => expect(analyzeNumber('7')!.isCarmichael).toBe(false));
  });
});
