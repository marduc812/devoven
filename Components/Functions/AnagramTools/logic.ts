export function normalizeForAnagram(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '').split('').sort().join('');
}

export function isAnagram(a: string, b: string): boolean {
  return normalizeForAnagram(a) === normalizeForAnagram(b);
}

export function getLetterFrequency(s: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const ch of s.toLowerCase().replace(/[^a-z]/g, '')) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  return freq;
}

export interface LetterBalance {
  letter: string;
  countA: number;
  countB: number;
  /** countA - countB: positive means A has a surplus, negative means B does. */
  diff: number;
}

export interface AnagramComparison {
  a: string;
  b: string;
  /** Letters only, lowercased and sorted — the anagram fingerprint. */
  normalizedA: string;
  normalizedB: string;
  isAnagram: boolean;
  /** Every letter appearing in either string, alphabetical. */
  letters: LetterBalance[];
  lettersA: number;
  lettersB: number;
  /** How many single-letter changes separate the two multisets. */
  mismatchCount: number;
}

export function compareAnagram(a: string, b: string): AnagramComparison {
  const freqA = getLetterFrequency(a);
  const freqB = getLetterFrequency(b);

  const letters = [...new Set([...freqA.keys(), ...freqB.keys()])].sort().map(letter => {
    const countA = freqA.get(letter) ?? 0;
    const countB = freqB.get(letter) ?? 0;
    return { letter, countA, countB, diff: countA - countB };
  });

  const normalizedA = normalizeForAnagram(a);
  const normalizedB = normalizeForAnagram(b);

  return {
    a,
    b,
    normalizedA,
    normalizedB,
    isAnagram: normalizedA === normalizedB,
    letters,
    lettersA: normalizedA.length,
    lettersB: normalizedB.length,
    mismatchCount: letters.reduce((sum, l) => sum + Math.abs(l.diff), 0),
  };
}
