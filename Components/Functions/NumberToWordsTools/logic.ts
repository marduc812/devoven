// Pure TypeScript — no browser APIs, no React.
// Converts a number (integer or decimal) to English words.

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

const SCALES = [
  '', 'thousand', 'million', 'billion', 'trillion',
];

function chunkToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)];
    const ones = ONES[n % 10];
    return ones ? tens + '-' + ones : tens;
  }
  const hundreds = ONES[Math.floor(n / 100)] + ' hundred';
  const rest = n % 100;
  if (rest === 0) return hundreds;
  return hundreds + ' ' + chunkToWords(rest);
}

function integerToWords(n: number): string {
  if (n === 0) return 'zero';

  const chunks: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    chunks.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;
    const words = chunkToWords(chunk);
    const scale = SCALES[i];
    parts.push(scale ? words + ' ' + scale : words);
  }

  return parts.join(' ');
}

export function numberToWords(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const isNegative = trimmed.startsWith('-');
  const abs = isNegative ? trimmed.slice(1) : trimmed;

  // Split on decimal point
  const dotIdx = abs.indexOf('.');
  const intPart = dotIdx === -1 ? abs : abs.slice(0, dotIdx);
  const decPart = dotIdx === -1 ? '' : abs.slice(dotIdx + 1);

  const intNum = parseInt(intPart, 10);
  if (isNaN(intNum)) throw new Error('Invalid number');
  if (intNum > 999999999999999) throw new Error('Number too large (max 999 trillion)');

  let result = integerToWords(intNum);

  if (decPart) {
    // Read decimal digits individually
    const digits = decPart.split('').map((d) => ONES[parseInt(d, 10)] || 'zero');
    result += ' point ' + digits.join(' ');
  }

  if (isNegative && result !== 'zero') {
    result = 'negative ' + result;
  }

  return result;
}
