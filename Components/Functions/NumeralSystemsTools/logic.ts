// Pure TypeScript — no browser APIs. Buffer, Math, Intl, Date are fine.

export type NumeralRepresentation = {
  decimal: string;
  binary: string;
  octal: string;
  hexadecimal: string;
  base36: string;
  roman: string;
  scientific: string;
  words: string;
  ieee754: string;
  fraction: string;
};

// ─── Roman Numerals ────────────────────────────────────────────────────────────

const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'],  [90,  'XC'], [50,  'L'], [40,  'XL'],
  [10,  'X'],  [9,   'IX'], [5,   'V'], [4,   'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return 'N/A';
  let result = '';
  for (const [value, numeral] of ROMAN_MAP) {
    while (n >= value) {
      result += numeral;
      n -= value;
    }
  }
  return result;
}

// ─── Number to Words (English) ────────────────────────────────────────────────

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
              'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
              'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty',
              'sixty', 'seventy', 'eighty', 'ninety'];

function wordsUnder1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const rem = n % 10;
    return TENS[Math.floor(n / 10)] + (rem ? '-' + ONES[rem] : '');
  }
  const rem = n % 100;
  return ONES[Math.floor(n / 100)] + ' hundred' + (rem ? ' ' + wordsUnder1000(rem) : '');
}

export function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return 'not a number';
  if (n === 0) return 'zero';

  const negative = n < 0;
  const abs = Math.abs(Math.round(n));

  const groups: string[] = [];
  const suffixes = ['', ' thousand', ' million', ' billion', ' trillion'];
  let remaining = abs;
  let si = 0;

  while (remaining > 0 && si < suffixes.length) {
    const chunk = remaining % 1000;
    if (chunk !== 0) groups.unshift(wordsUnder1000(chunk) + suffixes[si]);
    remaining = Math.floor(remaining / 1000);
    si++;
  }

  return (negative ? 'negative ' : '') + groups.join(', ');
}

// ─── IEEE 754 float32 ─────────────────────────────────────────────────────────

export function toIeee754(n: number): string {
  const buf = Buffer.alloc(4);
  buf.writeFloatBE(n, 0);
  const bits = buf.readUInt32BE(0).toString(2).padStart(32, '0');
  return `${bits[0]} ${bits.slice(1, 9)} ${bits.slice(9)}`;
}

// ─── Known Fractions ──────────────────────────────────────────────────────────

const KNOWN_FRACTIONS: [number, string][] = [
  [0.5, '1/2'], [0.25, '1/4'], [0.75, '3/4'],
  [0.125, '1/8'], [0.375, '3/8'], [0.625, '5/8'], [0.875, '7/8'],
  [1/3, '1/3'], [2/3, '2/3'],
  [1/6, '1/6'], [5/6, '5/6'],
  [0.1, '1/10'], [0.2, '1/5'], [0.3, '3/10'], [0.4, '2/5'],
  [0.6, '3/5'], [0.7, '7/10'], [0.8, '4/5'], [0.9, '9/10'],
];

export function toFraction(n: number): string {
  if (Number.isInteger(n)) return String(n) + '/1';
  for (const [val, frac] of KNOWN_FRACTIONS) {
    if (Math.abs(n - val) < 1e-9) return frac;
  }
  // Generic GCD approach for simple fractions
  const denomMax = 1000;
  for (let d = 2; d <= denomMax; d++) {
    const num = Math.round(n * d);
    if (Math.abs(num / d - n) < 1e-9) {
      const g = gcd(Math.abs(num), d);
      return `${num / g}/${d / g}`;
    }
  }
  return 'N/A';
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// ─── Main conversion ──────────────────────────────────────────────────────────

export function convertNumeral(input: string): NumeralRepresentation | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;

  const isInt = Number.isInteger(n);

  return {
    decimal: n.toString(),
    binary: isInt ? (n >= 0 ? Math.abs(n).toString(2) : '-' + Math.abs(n).toString(2)) : 'N/A (float)',
    octal: isInt && n >= 0 ? n.toString(8) : 'N/A',
    hexadecimal: isInt && n >= 0 ? n.toString(16).toUpperCase() : 'N/A',
    base36: isInt && n >= 0 ? n.toString(36).toUpperCase() : 'N/A',
    roman: isInt ? toRoman(n) : 'N/A',
    scientific: n.toExponential(),
    words: isInt ? numberToWords(n) : numberToWords(n) + ' (approx.)',
    ieee754: toIeee754(n),
    fraction: isInt ? `${n}/1` : toFraction(n),
  };
}

// ─── Reference table (first 256 values) ──────────────────────────────────────

export type ReferenceRow = {
  decimal: number;
  binary: string;
  octal: string;
  hex: string;
  char: string;
};

export function getReferenceTable(start: number, count: number): ReferenceRow[] {
  const rows: ReferenceRow[] = [];
  for (let n = start; n < start + count && n <= 255; n++) {
    rows.push({
      decimal: n,
      binary: n.toString(2).padStart(8, '0'),
      octal: n.toString(8).padStart(3, '0'),
      hex: n.toString(16).toUpperCase().padStart(2, '0'),
      char: n >= 32 && n <= 126 ? String.fromCharCode(n) : '',
    });
  }
  return rows;
}
