export interface NumberTheoryResult {
  n: number;
  isPrime: boolean;
  primeFactors: Array<{ prime: number; exponent: number }>;
  totient: number;
  divisors: number[];
  divisorCount: number;
  sumOfDivisors: number;
  classification: 'perfect' | 'abundant' | 'deficient';
  liouville: number; // +1 or -1
  mobius: number; // 0, +1, or -1
  isPerfectSquare: boolean;
  isPerfectCube: boolean;
  digitalRoot: number;
  digitSum: number;
  collatz: number[]; // sequence (capped at 100 terms)
  collatzLength: number;
  isCarmichael: boolean;
}

function isPrimeNum(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const limit = Math.floor(Math.sqrt(n));
  for (let i = 3; i <= limit; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function primeFactorize(n: number): Array<{ prime: number; exponent: number }> {
  const factors: Array<{ prime: number; exponent: number }> = [];
  let remaining = n;
  for (let d = 2; d * d <= remaining; d++) {
    if (remaining % d === 0) {
      let exp = 0;
      while (remaining % d === 0) {
        exp++;
        remaining = Math.floor(remaining / d);
      }
      factors.push({ prime: d, exponent: exp });
    }
  }
  if (remaining > 1) factors.push({ prime: remaining, exponent: 1 });
  return factors;
}

function eulerTotient(n: number, factors: Array<{ prime: number; exponent: number }>): number {
  let result = n;
  for (const { prime } of factors) {
    result = result - Math.floor(result / prime);
  }
  return result;
}

function getDivisors(n: number): number[] {
  const divs: number[] = [];
  const limit = Math.floor(Math.sqrt(n));
  for (let i = 1; i <= limit; i++) {
    if (n % i === 0) {
      divs.push(i);
      if (i !== n / i) divs.push(n / i);
    }
  }
  return divs.sort((a, b) => a - b);
}

function computeDigitalRoot(n: number): number {
  if (n === 0) return 0;
  const r = n % 9;
  return r === 0 ? 9 : r;
}

function digitSum(n: number): number {
  return String(n).split('').reduce((acc, c) => acc + parseInt(c, 10), 0);
}

function collatzSeq(n: number): number[] {
  const seq: number[] = [n];
  let current = n;
  while (current !== 1 && seq.length < 200) {
    if (current % 2 === 0) {
      current = Math.floor(current / 2);
    } else {
      current = 3 * current + 1;
    }
    seq.push(current);
  }
  return seq;
}

// Fermat's primality test for Carmichael check
function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return result;
}

function isCarmichaelNum(n: number, factors: Array<{ prime: number; exponent: number }>): boolean {
  // Carmichael numbers: composite, all prime factors are distinct (squarefree), p-1 | n-1 for all prime factors p
  if (n < 2) return false;
  if (isPrimeNum(n)) return false;
  // must be squarefree
  for (const { exponent } of factors) {
    if (exponent > 1) return false;
  }
  // Korselt's criterion: (p-1) | (n-1) for all prime factors
  for (const { prime } of factors) {
    if ((n - 1) % (prime - 1) !== 0) return false;
  }
  return true;
}

export function analyzeNumber(input: string): NumberTheoryResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  if (isNaN(n) || n < 1 || n > 1000000) return null;

  const factors = primeFactorize(n);
  const isPrime = isPrimeNum(n);
  const divisors = getDivisors(n);
  const divisorCount = divisors.length;
  // proper divisors sum (exclude n itself)
  const properDivisorSum = divisors.filter(d => d !== n).reduce((a, b) => a + b, 0);
  const sumOfDivisors = divisors.reduce((a, b) => a + b, 0);

  const classification: 'perfect' | 'abundant' | 'deficient' =
    properDivisorSum === n ? 'perfect' : properDivisorSum > n ? 'abundant' : 'deficient';

  const totalPrimeFactorCount = factors.reduce((acc, f) => acc + f.exponent, 0);
  const liouville = totalPrimeFactorCount % 2 === 0 ? 1 : -1;
  // Mobius: 0 if any prime factor has exponent > 1, else (-1)^(number of prime factors)
  const hasSquareFactor = factors.some(f => f.exponent > 1);
  const mobius = hasSquareFactor ? 0 : (factors.length % 2 === 0 ? 1 : -1);

  const sqrtN = Math.round(Math.sqrt(n));
  const cbrtN = Math.round(Math.cbrt(n));
  const isPerfectSquare = sqrtN * sqrtN === n;
  const isPerfectCube = cbrtN * cbrtN * cbrtN === n;

  const totient = eulerTotient(n, factors);

  const seq = collatzSeq(n);
  const collatzCapped = seq.length > 150 ? seq.slice(0, 150) : seq;

  return {
    n,
    isPrime,
    primeFactors: factors,
    totient,
    divisors,
    divisorCount,
    sumOfDivisors,
    classification,
    liouville,
    mobius,
    isPerfectSquare,
    isPerfectCube,
    digitalRoot: computeDigitalRoot(n),
    digitSum: digitSum(n),
    collatz: collatzCapped,
    collatzLength: seq.length,
    isCarmichael: isCarmichaelNum(n, factors),
  };
}
