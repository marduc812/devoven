// Pure TypeScript — no browser APIs, no React.

export interface FactorizationResult {
  number: number;
  factors: Array<{ base: number; exp: number }>;
  expression: string;
  divisors: number[];
  numDivisors: number;
  sumDivisors: number;
  classification: 'perfect' | 'abundant' | 'deficient' | 'none';
}

export function primeFactorize(n: number): Array<{ base: number; exp: number }> {
  if (n < 2) return [];
  const result: Array<{ base: number; exp: number }> = [];
  let num = n;

  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) {
      let exp = 0;
      while (num % i === 0) {
        exp++;
        num = Math.floor(num / i);
      }
      result.push({ base: i, exp });
    }
  }
  if (num > 1) result.push({ base: num, exp: 1 });
  return result;
}

export function getDivisors(n: number): number[] {
  if (n < 1) return [];
  const divs: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      divs.push(i);
      if (i !== Math.floor(n / i)) divs.push(Math.floor(n / i));
    }
  }
  return divs.sort((a, b) => a - b);
}

export function superscript(n: number): string {
  const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map(c => map[c] || c).join('');
}

/**
 * Same computation as analyzeNumber, but returns the result instead of a
 * pre-rendered string so the UI can lay it out.
 */
export function analyzeFactorization(input: string): FactorizationResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const n = parseInt(trimmed, 10);
  if (isNaN(n) || !Number.isFinite(n)) throw new Error('Enter a valid integer');
  if (n <= 0) throw new Error('Enter a positive integer greater than zero');
  if (n > 999999999999999) throw new Error('Number too large (max 15 digits)');

  const factors = primeFactorize(n);
  const divisors = getDivisors(n);
  const sumDivisors = divisors.reduce((a, b) => a + b, 0);
  const properSum = sumDivisors - n;

  let classification: FactorizationResult['classification'] = 'none';
  if (n > 1) {
    classification = properSum === n ? 'perfect' : properSum > n ? 'abundant' : 'deficient';
  }

  return {
    number: n,
    factors,
    expression: factorExpression(factors),
    divisors,
    numDivisors: divisors.length,
    sumDivisors,
    classification,
  };
}

/** "2² × 3 × 5" — empty string for 1, which has no prime factors. */
export function factorExpression(factors: Array<{ base: number; exp: number }>): string {
  if (factors.length === 0) return '';
  return factors.map(f => (f.exp > 1 ? `${f.base}${superscript(f.exp)}` : `${f.base}`)).join(' × ');
}

export function isPrimeFactorization(factors: Array<{ base: number; exp: number }>): boolean {
  return factors.length === 1 && factors[0].exp === 1;
}
