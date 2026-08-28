const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function getMissingLetters(text: string): string[] {
  const lower = text.toLowerCase();
  return ALPHABET.filter(ch => !lower.includes(ch));
}

export function isPangram(text: string): boolean {
  return getMissingLetters(text).length === 0;
}

export function getLetterFrequency(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const ch of ALPHABET) freq[ch] = 0;
  for (const ch of text.toLowerCase()) {
    if (ch >= 'a' && ch <= 'z') freq[ch]++;
  }
  return freq;
}

export function isIsogram(text: string): boolean {
  const letters = text.toLowerCase().replace(/[^a-z]/g, '').split('');
  return letters.length === new Set(letters).size && letters.length > 0;
}

export function findShortestPangram(text: string): string {
  // Split into sentences and find the shortest one that is a pangram
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  let shortest = '';
  for (const sentence of sentences) {
    if (isPangram(sentence)) {
      if (shortest === '' || sentence.length < shortest.length) {
        shortest = sentence;
      }
    }
  }
  return shortest;
}

export function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
}

export interface SentenceReport {
  text: string;
  isPangram: boolean;
  missing: string[];
}

export interface PangramResult {
  isPangram: boolean;
  isIsogram: boolean;
  /** A pangram using each of the 26 letters exactly once. */
  isPerfectPangram: boolean;
  missing: string[];
  present: string[];
  frequency: Record<string, number>;
  /** a–z characters only; punctuation, digits and spaces are not counted. */
  letterCount: number;
  uniqueLetters: number;
  charCount: number;
  wordCount: number;
  /** Distinct letters used, 0–1. */
  coverage: number;
  /** How many letters over the bare minimum of 26 the text spends. */
  excessLetters: number;
  mostCommon: { letter: string; count: number } | null;
  /** Present letters used exactly once — the ones a pangram hangs on. */
  onceOnly: string[];
  shortestPangram: string;
  sentences: SentenceReport[];
}

export function analyzePangramResult(input: string): PangramResult {
  const freq = getLetterFrequency(input);
  const missing = ALPHABET.filter(ch => freq[ch] === 0);
  const present = ALPHABET.filter(ch => freq[ch] > 0);
  const letterCount = present.reduce((sum, ch) => sum + freq[ch], 0);
  const pangram = missing.length === 0;

  const mostCommon = present.reduce<{ letter: string; count: number } | null>(
    (best, ch) => (best === null || freq[ch] > best.count ? { letter: ch, count: freq[ch] } : best),
    null
  );

  return {
    isPangram: pangram,
    isIsogram: isIsogram(input),
    isPerfectPangram: pangram && letterCount === 26,
    missing,
    present,
    frequency: freq,
    letterCount,
    uniqueLetters: present.length,
    charCount: input.length,
    wordCount: input.trim() ? input.trim().split(/\s+/).length : 0,
    coverage: present.length / 26,
    excessLetters: Math.max(0, letterCount - 26),
    mostCommon,
    onceOnly: present.filter(ch => freq[ch] === 1),
    shortestPangram: findShortestPangram(input),
    sentences: splitSentences(input).map(text => ({
      text,
      isPangram: isPangram(text),
      missing: getMissingLetters(text),
    })),
  };
}

export function analyzePangram(input: string): string {
  if (!input.trim()) throw new Error('Enter some text');

  const pangram = isPangram(input);
  const missing = getMissingLetters(input);
  const freq = getLetterFrequency(input);
  const isogram = isIsogram(input);
  const shortestPangram = findShortestPangram(input);

  const freqLines = ALPHABET.map(ch => {
    const count = freq[ch];
    const bar = '|'.repeat(Math.min(count, 20));
    return `  ${ch}: ${String(count).padStart(3)}  ${bar}`;
  });

  const lines: string[] = [
    `Pangram:       ${pangram ? 'Yes ✓' : 'No ✗'}`,
    `Isogram:       ${isogram ? 'Yes ✓' : 'No ✗'}`,
    '',
    pangram
      ? 'All 26 letters present!'
      : `Missing letters (${missing.length}): ${missing.join(', ')}`,
    '',
    'Letter frequency:',
    ...freqLines,
  ];

  if (shortestPangram && shortestPangram !== input.trim()) {
    lines.push('');
    lines.push(`Shortest pangram sentence: "${shortestPangram}"`);
  }

  return lines.join('\n');
}
