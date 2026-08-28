export function shannonEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export interface CharFrequency {
  char: string;
  /** Printable label — control characters are spelled out. */
  display: string;
  count: number;
  share: number;
}

export interface CharsetClass {
  name: string;
  size: number;
  present: boolean;
}

export interface EntropyAnalysis {
  length: number;
  uniqueChars: number;
  /** Shannon entropy of the observed distribution, in bits per character. */
  entropy: number;
  /** Ceiling for the observed alphabet: log2(unique characters). */
  maxEntropy: number;
  /** entropy / maxEntropy, 0–1. */
  efficiency: number;
  totalBits: number;
  assessment: string;
  /** 0–5, matching the assessment bands. */
  level: number;
  frequencies: CharFrequency[];
  charsets: CharsetClass[];
  /** Size of the pool an attacker would brute-force, from the classes present. */
  poolSize: number;
  /** length * log2(poolSize) — the search-space view, not the observed one. */
  bruteForceBits: number;
}

const CHARSET_CLASSES: { name: string; size: number; test: RegExp }[] = [
  { name: 'Lowercase', size: 26, test: /[a-z]/ },
  { name: 'Uppercase', size: 26, test: /[A-Z]/ },
  { name: 'Digits', size: 10, test: /[0-9]/ },
  { name: 'Symbols', size: 32, test: /[!-/:-@[-`{-~]/ },
  { name: 'Space', size: 1, test: / / },
  { name: 'Other', size: 100, test: /[^\x20-\x7e]/ },
];

function displayChar(ch: string): string {
  if (ch === ' ') return 'space';
  if (ch === '\n') return '\\n';
  if (ch === '\t') return '\\t';
  if (ch === '\r') return '\\r';
  if (ch.charCodeAt(0) < 32) return `\\x${ch.charCodeAt(0).toString(16).padStart(2, '0')}`;
  return ch;
}

function assess(entropy: number): { assessment: string; level: number } {
  if (entropy < 2) return { assessment: 'Very low (highly predictable)', level: 0 };
  if (entropy < 3) return { assessment: 'Low (structured text)', level: 1 };
  if (entropy < 4) return { assessment: 'Moderate (natural language)', level: 2 };
  if (entropy < 5) return { assessment: 'High (mixed content)', level: 3 };
  if (entropy < 6) return { assessment: 'Very high (random-looking)', level: 4 };
  return { assessment: 'Excellent (near-maximum randomness)', level: 5 };
}

export function analyzeEntropy(input: string): EntropyAnalysis {
  if (!input) throw new Error('Enter some text');

  const entropy = shannonEntropy(input);
  const uniqueChars = new Set(input).size;
  const maxEntropy = Math.log2(uniqueChars);
  const totalBits = entropy * input.length;

  const freq = new Map<string, number>();
  for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const frequencies: CharFrequency[] = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([char, count]) => ({
      char,
      display: displayChar(char),
      count,
      share: count / input.length,
    }));

  const charsets: CharsetClass[] = CHARSET_CLASSES.map(c => ({
    name: c.name,
    size: c.size,
    present: c.test.test(input),
  }));
  const poolSize = charsets.reduce((sum, c) => sum + (c.present ? c.size : 0), 0);
  const bruteForceBits = poolSize > 1 ? input.length * Math.log2(poolSize) : 0;

  return {
    length: input.length,
    uniqueChars,
    entropy,
    maxEntropy,
    efficiency: maxEntropy > 0 ? entropy / maxEntropy : 0,
    totalBits,
    ...assess(entropy),
    frequencies,
    charsets,
    poolSize,
    bruteForceBits,
  };
}

export function calculateEntropy(input: string): string {
  if (!input) throw new Error('Enter some text');

  const entropy = shannonEntropy(input);
  const maxEntropy = Math.log2(new Set(input).size);
  const uniqueChars = new Set(input).size;
  const totalBits = entropy * input.length;

  // Assess randomness
  let assessment: string;
  if (entropy < 2) assessment = 'Very low (highly predictable)';
  else if (entropy < 3) assessment = 'Low (structured text)';
  else if (entropy < 4) assessment = 'Moderate (natural language)';
  else if (entropy < 5) assessment = 'High (mixed content)';
  else if (entropy < 6) assessment = 'Very high (random-looking)';
  else assessment = 'Excellent (near-maximum randomness)';

  // Character frequency
  const freq = new Map<string, number>();
  for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const topChars = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);

  return [
    `Length:          ${input.length} characters`,
    `Unique chars:    ${uniqueChars}`,
    `Shannon entropy: ${entropy.toFixed(4)} bits/char`,
    `Max entropy:     ${maxEntropy.toFixed(4)} bits/char`,
    `Total bits:      ${totalBits.toFixed(1)} bits`,
    `Assessment:      ${assessment}`,
    ``,
    `Top 5 characters:`,
    ...topChars.map(([ch, count]) => {
      const display = ch === ' ' ? '(space)' : ch === '\n' ? '(newline)' : `'${ch}'`;
      return `  ${display.padEnd(10)} ${count}x  (${((count/input.length)*100).toFixed(1)}%)`;
    }),
  ].join('\n');
}
