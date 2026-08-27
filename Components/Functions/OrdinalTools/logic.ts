export function toOrdinal(n: number): string {
  if (!Number.isInteger(n)) throw new Error('Input must be an integer');
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;
  let suffix: string;
  if (lastTwo >= 11 && lastTwo <= 13) suffix = 'th';
  else if (lastOne === 1) suffix = 'st';
  else if (lastOne === 2) suffix = 'nd';
  else if (lastOne === 3) suffix = 'rd';
  else suffix = 'th';
  return `${n}${suffix}`;
}

export function toOrdinalWords(n: number): string {
  const ones = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth',
    'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth',
    'seventeenth', 'eighteenth', 'nineteenth'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const tensOrd = ['', '', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth', 'eightieth', 'ninetieth'];

  if (n < 0 || !Number.isInteger(n)) throw new Error('Input must be a non-negative integer');
  if (n === 0) return 'zeroth';
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (o === 0) return tensOrd[t];
  return `${tens[t]}-${ones[o]}`;
}

export function convertOrdinals(input: string): string {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  const results: string[] = [];
  for (const line of lines) {
    const n = parseInt(line);
    if (isNaN(n)) { results.push(`"${line}" — not a number`); continue; }
    const ordNum = toOrdinal(n);
    const word = n >= 0 && n < 100 ? ` (${toOrdinalWords(n)})` : '';
    results.push(`${n} → ${ordNum}${word}`);
  }
  if (results.length === 0) throw new Error('Enter numbers (one per line)');
  return results.join('\n');
}
