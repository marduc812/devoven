// Pure TypeScript — no browser APIs, no React.
// Number to English words with ordinal and short-scale output.

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

const SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];

const ORDINAL_EXCEPTIONS: Record<string, string> = {
  one: 'first', two: 'second', three: 'third', four: 'fourth', five: 'fifth',
  six: 'sixth', seven: 'seventh', eight: 'eighth', nine: 'ninth',
  ten: 'tenth', eleven: 'eleventh', twelve: 'twelfth',
  thirteen: 'thirteenth', fourteen: 'fourteenth', fifteen: 'fifteenth',
  sixteen: 'sixteenth', seventeen: 'seventeenth', eighteen: 'eighteenth',
  nineteen: 'nineteenth', twenty: 'twentieth', thirty: 'thirtieth',
  forty: 'fortieth', fifty: 'fiftieth', sixty: 'sixtieth',
  seventy: 'seventieth', eighty: 'eightieth', ninety: 'ninetieth',
  hundred: 'hundredth', thousand: 'thousandth', million: 'millionth',
  billion: 'billionth', trillion: 'trillionth',
};

function chunkToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    const o = ONES[n % 10];
    return o ? `${t}-${o}` : t;
  }
  const h = ONES[Math.floor(n / 100)] + ' hundred';
  const rest = n % 100;
  return rest === 0 ? h : `${h} ${chunkToWords(rest)}`;
}

function integerToWords(n: number): string {
  if (n === 0) return 'zero';
  const chunks: number[] = [];
  let rem = n;
  while (rem > 0) {
    chunks.push(rem % 1000);
    rem = Math.floor(rem / 1000);
  }
  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;
    const w = chunkToWords(chunk);
    parts.push(SCALES[i] ? `${w} ${SCALES[i]}` : w);
  }
  return parts.join(' ');
}

export function toOrdinal(words: string): string {
  const wordList = words.split(' ');
  const last = wordList[wordList.length - 1];

  // Handle hyphenated last word (e.g. thirty-four)
  if (last.includes('-')) {
    const parts = last.split('-');
    const lastPart = parts[parts.length - 1];
    parts[parts.length - 1] = ORDINAL_EXCEPTIONS[lastPart] || lastPart + 'th';
    wordList[wordList.length - 1] = parts.join('-');
    return wordList.join(' ');
  }

  wordList[wordList.length - 1] = ORDINAL_EXCEPTIONS[last] || last + 'th';
  return wordList.join(' ');
}

export function convertNumberWords(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const isNeg = trimmed.startsWith('-');
  const abs = isNeg ? trimmed.slice(1) : trimmed;
  const n = parseInt(abs, 10);

  if (isNaN(n)) throw new Error('Enter a valid integer');
  if (n > 999999999999999) throw new Error('Number too large (max 999 trillion)');

  if (n === 0) return 'zeroth';

  const ordinal = toOrdinal(integerToWords(n));
  return isNeg ? `negative ${ordinal}` : ordinal;
}
