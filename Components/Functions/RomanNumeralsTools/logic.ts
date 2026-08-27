// Pure TypeScript — no browser APIs, no React.

const ROMAN_VALUES: Array<[string, number]> = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
  ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
];

export function intToRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) {
    throw new Error('Number must be an integer between 1 and 3999');
  }
  let result = '';
  let remaining = n;
  for (const [symbol, value] of ROMAN_VALUES) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

export function romanToInt(roman: string): number {
  const upper = roman.trim().toUpperCase();
  if (!upper) throw new Error('Enter a Roman numeral');

  // Validate characters
  if (!/^[IVXLCDM]+$/.test(upper)) {
    throw new Error('Invalid characters. Use only I, V, X, L, C, D, M');
  }

  // Validate subtractive notation rules
  const validPattern = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  if (!validPattern.test(upper)) {
    throw new Error('Invalid Roman numeral format (check subtractive notation rules)');
  }

  const valueMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const curr = valueMap[upper[i]];
    const next = valueMap[upper[i + 1]] || 0;
    if (curr < next) total -= curr;
    else total += curr;
  }
  if (total < 1 || total > 3999) throw new Error('Result out of range (1–3999)');
  return total;
}

export function isRomanInput(input: string): boolean {
  return /^[IVXLCDMivxlcdm\s]+$/.test(input.trim()) && !/^\d+$/.test(input.trim());
}

const CONVERSION_TABLE = [
  ['I', '1'], ['IV', '4'], ['V', '5'], ['IX', '9'],
  ['X', '10'], ['XL', '40'], ['L', '50'], ['XC', '90'],
  ['C', '100'], ['CD', '400'], ['D', '500'], ['CM', '900'],
  ['M', '1000'],
];

export function convertRoman(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const asRoman = isRomanInput(trimmed);

  const lines: string[] = [];

  if (asRoman) {
    const n = romanToInt(trimmed);
    lines.push(`Roman: ${trimmed.toUpperCase()}`);
    lines.push(`Arabic: ${n}`);
    lines.push('');
    lines.push('Breakdown:');
    const upper = trimmed.toUpperCase();
    const valueMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let i = 0;
    while (i < upper.length) {
      const curr = valueMap[upper[i]];
      const next = valueMap[upper[i + 1]] || 0;
      if (curr < next) {
        lines.push(`  ${upper[i]}${upper[i + 1]} = ${next - curr}`);
        i += 2;
      } else {
        lines.push(`  ${upper[i]} = ${curr}`);
        i++;
      }
    }
  } else {
    const n = parseInt(trimmed, 10);
    if (isNaN(n)) throw new Error('Enter an integer (1–3999) or a Roman numeral');
    const roman = intToRoman(n);
    lines.push(`Arabic: ${n}`);
    lines.push(`Roman: ${roman}`);
    lines.push('');
    lines.push('Conversion steps:');
    let remaining = n;
    for (const [symbol, value] of ROMAN_VALUES) {
      const count = Math.floor(remaining / value);
      if (count > 0) {
        lines.push(`  ${remaining} ÷ ${value} → ${count}× ${symbol}`);
        remaining -= count * value;
      }
    }
  }

  lines.push('');
  lines.push('Reference table:');
  CONVERSION_TABLE.forEach(([r, a]) => lines.push(`  ${r.padEnd(4)} = ${a}`));

  return lines.join('\n');
}
