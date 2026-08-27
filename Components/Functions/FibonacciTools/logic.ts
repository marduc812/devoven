// String-based big number addition for arbitrary precision
function addBigStrings(a: string, b: string): string {
  let carry = 0;
  let result = '';
  let i = a.length - 1;
  let j = b.length - 1;
  while (i >= 0 || j >= 0 || carry) {
    const digitA = i >= 0 ? parseInt(a[i--]) : 0;
    const digitB = j >= 0 ? parseInt(b[j--]) : 0;
    const sum = digitA + digitB + carry;
    carry = Math.floor(sum / 10);
    result = (sum % 10) + result;
  }
  return result || '0';
}

export function fibonacci(n: number): string[] {
  if (!Number.isInteger(n) || n < 1) throw new Error('Enter a positive integer');
  if (n > 1000) throw new Error('Maximum 1000 terms');
  const seq: string[] = ['0', '1'];
  for (let i = 2; i < n; i++) seq.push(addBigStrings(seq[i - 1], seq[i - 2]));
  return seq.slice(0, n);
}

export function formatFibonacci(input: string): string {
  const n = parseInt(input.trim());
  if (isNaN(n)) throw new Error('Enter a number of terms');
  const seq = fibonacci(n);
  const lines: string[] = [`First ${n} Fibonacci number(s):\n`];
  seq.forEach((val, i) => lines.push(`F(${String(i).padStart(4)}) = ${val}`));
  lines.push(`\nLast term has ${seq[seq.length - 1].length} digits`);
  return lines.join('\n');
}
