export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function primeFactors(n: number): number[] {
  if (n < 2) return [];
  const factors: number[] = [];
  let num = n;
  for (let i = 2; i * i <= num; i++) {
    while (num % i === 0) { factors.push(i); num /= i; }
  }
  if (num > 1) factors.push(num);
  return factors;
}

export function nextPrime(n: number): number {
  let candidate = Math.floor(n) + 1;
  while (!isPrime(candidate)) candidate++;
  return candidate;
}

export function previousPrime(n: number): number | null {
  let candidate = Math.ceil(n) - 1;
  while (candidate >= 2) {
    if (isPrime(candidate)) return candidate;
    candidate--;
  }
  return null;
}

export function sieveOfEratosthenes(limit: number): number[] {
  if (limit < 2) return [];
  const sieve = new Uint8Array(limit + 1).fill(1);
  sieve[0] = sieve[1] = 0;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 0;
  }
  return [...sieve.entries()].filter(([, v]) => v).map(([i]) => i);
}

export interface FactorPower {
  base: number;
  exponent: number;
}

export interface PrimeResult {
  n: number;
  isPrime: boolean;
  /** Flat list, e.g. 12 → [2, 2, 3]. */
  factors: number[];
  /** Grouped with exponents, e.g. 12 → [{2,2},{3,1}]. */
  factorization: FactorPower[];
  /** Rendered form, e.g. "2^2 × 3". */
  factorizationText: string;
  nextPrime: number;
  previousPrime: number | null;
  divisors: number[];
  divisorSum: number;
  /** 'perfect' | 'abundant' | 'deficient', from the sum of proper divisors. */
  divisorClass: 'perfect' | 'abundant' | 'deficient' | null;
  /** The other member of a twin-prime pair, when there is one. */
  twinPrime: number | null;
  /** π(n) — how many primes are ≤ n. Null when n is too large to sieve. */
  primeCount: number | null;
  /** The primes themselves, only for small n where a grid is readable. */
  primesUpTo: number[] | null;
}

/** Above this the sieve stops being worth the wait, so π(n) is omitted. */
const SIEVE_COUNT_LIMIT = 5_000_000;
/** Above this the prime grid would be an unreadable wall of chips. */
const SIEVE_GRID_LIMIT = 1_000;

/** π(n), counted in place — the full sieve array is never materialised. */
export function countPrimesUpTo(limit: number): number {
  if (limit < 2) return 0;
  const sieve = new Uint8Array(limit + 1).fill(1);
  sieve[0] = sieve[1] = 0;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 0;
  }
  let count = 0;
  for (let i = 2; i <= limit; i++) if (sieve[i]) count++;
  return count;
}

export function groupFactors(factors: number[]): FactorPower[] {
  return factors.reduce<FactorPower[]>((acc, f) => {
    const last = acc[acc.length - 1];
    if (last && last.base === f) last.exponent++;
    else acc.push({ base: f, exponent: 1 });
    return acc;
  }, []);
}

export function formatFactorization(grouped: FactorPower[]): string {
  return grouped.map(({ base, exponent }) => (exponent > 1 ? `${base}^${exponent}` : `${base}`)).join(' × ');
}

/** All divisors of n, ascending. Built from the factorisation, so it stays cheap. */
export function divisorsOf(n: number): number[] {
  if (n < 1) return [];
  const divisors = [1];
  for (const { base, exponent } of groupFactors(primeFactors(n))) {
    const existing = [...divisors];
    let power = 1;
    for (let e = 0; e < exponent; e++) {
      power *= base;
      for (const d of existing) divisors.push(d * power);
    }
  }
  return [...new Set(divisors)].sort((a, b) => a - b);
}

export function parsePrimeInput(input: string): number {
  const n = parseInt(input.trim());
  if (isNaN(n)) throw new Error('Enter an integer');
  if (n < 0) throw new Error('Enter a non-negative integer');
  // Trial division runs to √n, so anything past this makes the page hang.
  if (n > 1e12) throw new Error('Number is too large — enter a value up to 1,000,000,000,000');
  return n;
}

export function analyzePrimeResult(input: string): PrimeResult {
  const n = parsePrimeInput(input);
  const prime = isPrime(n);
  const factors = primeFactors(n);
  const factorization = groupFactors(factors);
  const divisors = n >= 1 ? divisorsOf(n) : [];
  const properSum = divisors.slice(0, -1).reduce((a, b) => a + b, 0);

  let twinPrime: number | null = null;
  if (prime) {
    if (isPrime(n + 2)) twinPrime = n + 2;
    else if (n > 2 && isPrime(n - 2)) twinPrime = n - 2;
  }

  const canSieve = n >= 2 && n <= SIEVE_COUNT_LIMIT;
  const primesUpTo = n >= 2 && n <= SIEVE_GRID_LIMIT ? sieveOfEratosthenes(n) : null;
  const primeCount = primesUpTo ? primesUpTo.length : canSieve ? countPrimesUpTo(n) : null;

  return {
    n,
    isPrime: prime,
    factors,
    factorization,
    factorizationText: factorization.length ? formatFactorization(factorization) : 'none (n < 2)',
    nextPrime: nextPrime(n),
    previousPrime: previousPrime(n),
    divisors,
    divisorSum: divisors.reduce((a, b) => a + b, 0),
    divisorClass:
      n < 2 ? null : properSum === n ? 'perfect' : properSum > n ? 'abundant' : 'deficient',
    twinPrime,
    primeCount,
    primesUpTo,
  };
}

export function analyzePrime(input: string): string {
  const n = parseInt(input.trim());
  if (isNaN(n)) throw new Error('Enter an integer');
  if (n < 0) throw new Error('Enter a non-negative integer');

  const prime = isPrime(n);
  const factors = primeFactors(n);
  const factorStr = factors.length === 0 ? 'none (n < 2)' :
    factors.reduce((acc: Array<{base: number, exp: number}>, f) => {
      const last = acc[acc.length - 1];
      if (last && last.base === f) last.exp++;
      else acc.push({ base: f, exp: 1 });
      return acc;
    }, []).map(({base, exp}) => exp > 1 ? `${base}^${exp}` : `${base}`).join(' × ');

  const lines = [
    `Number:         ${n}`,
    `Prime:          ${prime ? 'Yes ✓' : 'No ✗'}`,
    `Prime factors:  ${factorStr}`,
  ];
  if (!prime && n >= 2) {
    lines.push(`Next prime:     ${nextPrime(n)}`);
  }
  if (n <= 200) {
    const primes = sieveOfEratosthenes(n);
    lines.push(`Primes up to ${n}: ${primes.length} prime(s)`);
  }
  return lines.join('\n');
}
