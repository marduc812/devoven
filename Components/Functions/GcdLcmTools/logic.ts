export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export function lcm(a: number, b: number): number {
  const g = gcd(a, b);
  if (g === 0) return 0;
  // Divide before multiplying so the intermediate stays as small as possible;
  // a * b leaves the exact integer range long before a / g * b does.
  return Math.abs(a) / g * Math.abs(b);
}

export function gcdMultiple(nums: number[]): number {
  if (nums.length === 0) throw new Error('Provide at least one number');
  return nums.reduce((acc, n) => gcd(acc, Math.abs(n)));
}

export function lcmMultiple(nums: number[]): number {
  if (nums.length === 0) throw new Error('Provide at least one number');
  return nums.reduce((acc, n) => lcm(acc, Math.abs(n)));
}

/** Splits on whitespace or commas and rejects anything that is not a positive integer. */
export function parseNumberList(input: string): number[] {
  const nums = input.trim().split(/[\s,]+/).map(n => parseInt(n)).filter(n => !isNaN(n));
  if (nums.length < 2) throw new Error('Enter at least 2 numbers (space or comma separated)');
  if (nums.some(n => n <= 0)) throw new Error('All numbers must be positive integers');
  return nums;
}

export interface FactorPower {
  prime: number;
  exponent: number;
}

/** Trial division. Inputs are user-typed integers, so the square-root bound is plenty. */
export function primeFactors(n: number): FactorPower[] {
  const out: FactorPower[] = [];
  let rest = Math.abs(Math.round(n));
  if (rest < 2) return out;

  for (let p = 2; p * p <= rest; p += p === 2 ? 1 : 2) {
    if (rest % p !== 0) continue;
    let exponent = 0;
    while (rest % p === 0) { rest /= p; exponent++; }
    out.push({ prime: p, exponent });
  }
  if (rest > 1) out.push({ prime: rest, exponent: 1 });
  return out;
}

/** `2^3 × 3 × 5` — the empty factorization is 1, not the empty string. */
export function formatFactorization(factors: FactorPower[]): string {
  if (factors.length === 0) return '1';
  return factors
    .map(f => (f.exponent === 1 ? String(f.prime) : `${f.prime}^${f.exponent}`))
    .join(' × ');
}

/** Every divisor of n, ascending. The common divisors of a set are the divisors of its GCD. */
export function divisorsOf(n: number): number[] {
  if (n < 1) return [];
  const small: number[] = [];
  const large: number[] = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d !== 0) continue;
    small.push(d);
    if (d !== n / d) large.push(n / d);
  }
  return small.concat(large.reverse());
}

export interface EuclidStep {
  a: number;
  b: number;
  quotient: number;
  remainder: number;
}

/** The division steps of the Euclidean algorithm; the last one has remainder 0. */
export function euclidSteps(a: number, b: number): EuclidStep[] {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  const steps: EuclidStep[] = [];
  while (y !== 0) {
    const quotient = Math.floor(x / y);
    const remainder = x % y;
    steps.push({ a: x, b: y, quotient, remainder });
    x = y;
    y = remainder;
  }
  return steps;
}

export interface GcdLcmReport {
  numbers: number[];
  gcd: number;
  lcm: number;
  /** False when the LCM grew past the exact integer range and is only approximate. */
  lcmExact: boolean;
  coprime: boolean;
  factorizations: { value: number; factors: FactorPower[]; isPrime: boolean }[];
  /** Every prime appearing in any input, ascending — the columns of the exponent grid. */
  primes: number[];
  /** Exponent of each prime in each number, aligned to `primes`. */
  exponentGrid: number[][];
  /** Per prime: the smallest exponent across the inputs. The GCD reads straight off this. */
  gcdExponents: number[];
  /** Per prime: the largest exponent across the inputs, which gives the LCM. */
  lcmExponents: number[];
  /** Only for a pair — the algorithm takes two numbers at a time. */
  steps: EuclidStep[];
  commonDivisors: number[];
  /** The pair reduced to lowest terms, when exactly two numbers were given. */
  reduced: [number, number] | null;
}

export function analyzeGcdLcm(input: string): GcdLcmReport {
  const numbers = parseNumberList(input);
  const g = gcdMultiple(numbers);
  const l = lcmMultiple(numbers);

  const factorizations = numbers.map(value => {
    const factors = primeFactors(value);
    return {
      value,
      factors,
      isPrime: factors.length === 1 && factors[0].exponent === 1,
    };
  });

  const primes = Array.from(
    new Set(factorizations.flatMap(f => f.factors.map(p => p.prime)))
  ).sort((a, b) => a - b);

  const exponentGrid = factorizations.map(f =>
    primes.map(p => f.factors.find(x => x.prime === p)?.exponent ?? 0)
  );

  const gcdExponents = primes.map((_, i) => Math.min(...exponentGrid.map(row => row[i])));
  const lcmExponents = primes.map((_, i) => Math.max(...exponentGrid.map(row => row[i])));

  return {
    numbers,
    gcd: g,
    lcm: l,
    lcmExact: Number.isSafeInteger(l),
    coprime: g === 1,
    factorizations,
    primes,
    exponentGrid,
    gcdExponents,
    lcmExponents,
    steps: numbers.length === 2 ? euclidSteps(numbers[0], numbers[1]) : [],
    commonDivisors: divisorsOf(g),
    reduced: numbers.length === 2 ? [numbers[0] / g, numbers[1] / g] : null,
  };
}
