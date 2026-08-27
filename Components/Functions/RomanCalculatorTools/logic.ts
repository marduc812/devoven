const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  if (n <= 0 || n > 3999) throw new Error('Number must be between 1 and 3999');
  if (!Number.isInteger(n)) throw new Error('Must be an integer');
  let result = '';
  for (const [value, numeral] of ROMAN_MAP) {
    while (n >= value) { result += numeral; n -= value; }
  }
  return result;
}

export function fromRoman(s: string): number {
  const str = s.toUpperCase().trim();
  const vals: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const cur = vals[str[i]];
    const next = vals[str[i + 1]];
    if (cur === undefined) throw new Error(`Invalid character: ${str[i]}`);
    if (next && cur < next) { total -= cur; } else { total += cur; }
  }
  return total;
}

export function romanCalculate(expr: string): string {
  const match = expr.trim().match(/^([IVXLCDM]+)\s*([+\-*/])\s*([IVXLCDM]+)$/i);
  if (!match) throw new Error('Format: ROMAN op ROMAN (e.g., XIV + VI)');

  const a = fromRoman(match[1]);
  const op = match[2];
  const b = fromRoman(match[3]);

  let result: number;
  switch (op) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = Math.floor(a / b); break;
    default: throw new Error('Unknown operator');
  }

  if (result <= 0 || result > 3999) throw new Error(`Result ${result} is out of roman numeral range (1-3999)`);

  return `${match[1].toUpperCase()} ${op} ${match[3].toUpperCase()} = ${result} = ${toRoman(result)}`;
}
