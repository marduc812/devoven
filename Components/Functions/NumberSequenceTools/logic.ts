// Pure TypeScript — no browser APIs.

function sieveOfEratosthenes(limit: number): number[] {
  const composite = new Array<boolean>(limit + 1).fill(false);
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (!composite[i]) {
      primes.push(i);
      for (let j = i * 2; j <= limit; j += i) {
        composite[j] = true;
      }
    }
  }
  return primes;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/** Generate Fibonacci sequence (n terms, string-based for large numbers) */
function fibSequence(n: number): string[] {
  if (n < 1) throw new Error('Count must be at least 1');
  if (n > 200) throw new Error('Maximum 200 terms');
  const seq: string[] = ['0', '1'];
  for (let i = 2; i < n; i++) {
    // Use native numbers for reasonable range
    const a = parseFloat(seq[i - 1]);
    const b = parseFloat(seq[i - 2]);
    seq.push((a + b).toString());
  }
  return seq.slice(0, n);
}

/** Generate primes up to the n-th prime or up to a limit */
function primesSequence(count: number): number[] {
  if (count < 1) throw new Error('Count must be at least 1');
  if (count > 1000) throw new Error('Maximum 1000 primes');
  // Estimate upper bound for nth prime: n * (ln n + ln ln n) for n >= 6
  let limit = count < 6 ? 15 : Math.ceil(count * (Math.log(count) + Math.log(Math.log(count))) * 1.3);
  if (limit < 50) limit = 50;
  let primes = sieveOfEratosthenes(limit);
  while (primes.length < count) {
    limit *= 2;
    primes = sieveOfEratosthenes(limit);
  }
  return primes.slice(0, count);
}

function squaresSequence(count: number): number[] {
  if (count < 1) throw new Error('Count must be at least 1');
  if (count > 10000) throw new Error('Maximum 10000 terms');
  const result: number[] = [];
  for (let i = 0; i < count; i++) result.push(i * i);
  return result;
}

function triangularSequence(count: number): number[] {
  if (count < 1) throw new Error('Count must be at least 1');
  if (count > 10000) throw new Error('Maximum 10000 terms');
  const result: number[] = [];
  for (let i = 0; i < count; i++) result.push((i * (i + 1)) / 2);
  return result;
}

function arithmeticSequence(start: number, step: number, count: number): number[] {
  if (count < 1) throw new Error('Count must be at least 1');
  if (count > 10000) throw new Error('Maximum 10000 terms');
  const result: number[] = [];
  for (let i = 0; i < count; i++) result.push(start + step * i);
  return result;
}

function geometricSequence(start: number, ratio: number, count: number): number[] {
  if (count < 1) throw new Error('Count must be at least 1');
  if (count > 500) throw new Error('Maximum 500 terms');
  if (ratio === 0) throw new Error('Ratio cannot be zero');
  const result: number[] = [];
  let current = start;
  for (let i = 0; i < count; i++) {
    result.push(current);
    current *= ratio;
  }
  return result;
}

function powersSequence(base: number, count: number): number[] {
  if (count < 1) throw new Error('Count must be at least 1');
  if (count > 100) throw new Error('Maximum 100 terms');
  const result: number[] = [];
  for (let i = 0; i < count; i++) result.push(Math.pow(base, i));
  return result;
}

export type SequenceResult = {
  title: string;
  sequence: string[];
  description: string;
};

/**
 * Parse and generate a number sequence from a text command.
 * Commands:
 *   fibonacci <count>
 *   primes <count>
 *   squares <count>
 *   triangular <count>
 *   arithmetic <start> <step> <count>
 *   geometric <start> <ratio> <count>
 *   powers <base> <count>
 */
export function generateSequence(input: string): SequenceResult {
  const parts = input.trim().toLowerCase().split(/\s+/);
  if (parts.length === 0 || !parts[0]) {
    throw new Error('Enter a command like: fibonacci 10, primes 20, arithmetic 1 2 10');
  }

  const cmd = parts[0];

  if (cmd === 'fibonacci' || cmd === 'fib') {
    const n = parseInt(parts[1] || '10');
    if (isNaN(n)) throw new Error('fibonacci <count>');
    const seq = fibSequence(n);
    return {
      title: `Fibonacci (${n} terms)`,
      sequence: seq,
      description: 'Each term is the sum of the two preceding terms. F(0)=0, F(1)=1.',
    };
  }

  if (cmd === 'primes') {
    const n = parseInt(parts[1] || '10');
    if (isNaN(n)) throw new Error('primes <count>');
    const seq = primesSequence(n);
    return {
      title: `Primes (first ${n})`,
      sequence: seq.map(String),
      description: 'Prime numbers: integers greater than 1 with no divisors other than 1 and themselves.',
    };
  }

  if (cmd === 'squares') {
    const n = parseInt(parts[1] || '10');
    if (isNaN(n)) throw new Error('squares <count>');
    const seq = squaresSequence(n);
    return {
      title: `Square Numbers (${n} terms)`,
      sequence: seq.map(String),
      description: 'n² for n = 0, 1, 2, ...',
    };
  }

  if (cmd === 'triangular') {
    const n = parseInt(parts[1] || '10');
    if (isNaN(n)) throw new Error('triangular <count>');
    const seq = triangularSequence(n);
    return {
      title: `Triangular Numbers (${n} terms)`,
      sequence: seq.map(String),
      description: 'T(n) = n*(n+1)/2 for n = 0, 1, 2, ...',
    };
  }

  if (cmd === 'arithmetic') {
    const start = parseFloat(parts[1] || '0');
    const step = parseFloat(parts[2] || '1');
    const count = parseInt(parts[3] || '10');
    if (isNaN(start) || isNaN(step) || isNaN(count)) throw new Error('arithmetic <start> <step> <count>');
    const seq = arithmeticSequence(start, step, count);
    return {
      title: `Arithmetic (start=${start}, step=${step}, n=${count})`,
      sequence: seq.map(String),
      description: `a(n) = ${start} + ${step}*n`,
    };
  }

  if (cmd === 'geometric') {
    const start = parseFloat(parts[1] || '1');
    const ratio = parseFloat(parts[2] || '2');
    const count = parseInt(parts[3] || '10');
    if (isNaN(start) || isNaN(ratio) || isNaN(count)) throw new Error('geometric <start> <ratio> <count>');
    const seq = geometricSequence(start, ratio, count);
    return {
      title: `Geometric (start=${start}, ratio=${ratio}, n=${count})`,
      sequence: seq.map(v => Number.isInteger(v) ? String(v) : v.toPrecision(6)),
      description: `a(n) = ${start} * ${ratio}^n`,
    };
  }

  if (cmd === 'powers') {
    const base = parseFloat(parts[1] || '2');
    const count = parseInt(parts[2] || '10');
    if (isNaN(base) || isNaN(count)) throw new Error('powers <base> <count>');
    const seq = powersSequence(base, count);
    return {
      title: `Powers of ${base} (${count} terms)`,
      sequence: seq.map(v => Number.isInteger(v) ? String(v) : v.toPrecision(6)),
      description: `a(n) = ${base}^n for n = 0, 1, 2, ...`,
    };
  }

  throw new Error(`Unknown command "${cmd}". Try: fibonacci, primes, squares, triangular, arithmetic, geometric, powers`);
}

export function formatResult(result: SequenceResult): string {
  const lines: string[] = [];
  lines.push(result.title);
  lines.push(result.description);
  lines.push('');
  // format in rows of 10
  const seq = result.sequence;
  for (let i = 0; i < seq.length; i += 10) {
    const chunk = seq.slice(i, i + 10);
    lines.push(chunk.map((v, j) => {
      const idx = String(i + j).padStart(4);
      return `[${idx}] ${v}`;
    }).join('   '));
  }
  lines.push('');
  lines.push(`Total: ${seq.length} terms`);
  return lines.join('\n');
}

/** Combined entry point for the tool */
export function processInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    const result = generateSequence(trimmed);
    return formatResult(result);
  } catch (e: unknown) {
    return e instanceof Error ? 'Error: ' + e.message : 'Invalid input';
  }
}

// Re-export for tests
export { isPrime, sieveOfEratosthenes };
