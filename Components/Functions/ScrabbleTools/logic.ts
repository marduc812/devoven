// Standard Scrabble letter values
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

export interface LetterScore {
  letter: string;
  value: number;
}

export interface WordScore {
  word: string;
  letters: LetterScore[];
  total: number;
}

/**
 * Score a single word. Returns the score breakdown per letter and total.
 */
export function scoreWord(word: string): WordScore {
  const upper = word.toUpperCase();
  const letters: LetterScore[] = [];
  let total = 0;
  for (const ch of upper) {
    const value = LETTER_VALUES[ch] !== undefined ? LETTER_VALUES[ch] : 0;
    letters.push({ letter: ch, value });
    total += value;
  }
  return { word, letters, total };
}

/**
 * Extract all words (sequences of letters) from arbitrary text.
 */
export function extractWords(text: string): string[] {
  const matches = text.match(/[A-Za-z]+/g);
  return matches ? matches : [];
}

/**
 * Score all words in a text. Returns array sorted by score descending.
 */
export function scoreAllWords(text: string): WordScore[] {
  const words = extractWords(text);
  const scored = words.map(w => scoreWord(w));
  scored.sort((a, b) => b.total - a.total);
  return scored;
}

/**
 * Get letter value distribution for the text (how many of each point tier).
 */
export function getValueDistribution(text: string): Record<number, number> {
  const dist: Record<number, number> = {};
  for (const ch of text.toUpperCase()) {
    if (LETTER_VALUES[ch] !== undefined) {
      const v = LETTER_VALUES[ch];
      dist[v] = (dist[v] || 0) + 1;
    }
  }
  return dist;
}

export function formatScrabbleOutput(text: string): string {
  if (!text.trim()) return '';
  const lines: string[] = [];

  const words = extractWords(text);
  if (words.length === 0) {
    return 'No words found in input. Enter letters or words to score.';
  }

  // Score the full input as one word if it's a single word
  if (words.length === 1) {
    const ws = scoreWord(words[0]);
    lines.push(`Word: ${ws.word}`);
    lines.push('');
    lines.push('Letter scores:');
    lines.push('  ' + ws.letters.map(l => `${l.letter}=${l.value}`).join('  '));
    lines.push('');
    lines.push(`Total score: ${ws.total}`);
  } else {
    // Multiple words — show top scorers
    const scored = scoreAllWords(text);

    // Total of all words
    const grandTotal = scored.reduce((sum, ws) => sum + ws.total, 0);
    lines.push(`Input contains ${words.length} word(s).`);
    lines.push(`Grand total score (all words): ${grandTotal}`);
    lines.push('');
    lines.push('Top-scoring words:');
    lines.push('  Word'.padEnd(20) + 'Score'.padEnd(8) + 'Letters');
    lines.push('  ' + '-'.repeat(60));
    const topN = Math.min(scored.length, 20);
    for (let i = 0; i < topN; i++) {
      const ws = scored[i];
      const letterStr = ws.letters.map(l => `${l.letter}=${l.value}`).join(' ');
      lines.push(`  ${ws.word.padEnd(19)} ${String(ws.total).padEnd(8)} ${letterStr}`);
    }
    if (scored.length > 20) {
      lines.push(`  ... and ${scored.length - 20} more words`);
    }
  }

  // Value distribution
  const dist = getValueDistribution(text);
  const tiers = Object.keys(dist).map(Number).sort((a, b) => a - b);
  if (tiers.length > 0) {
    lines.push('');
    lines.push('Letter value distribution:');
    for (const tier of tiers) {
      const letters = Object.keys(LETTER_VALUES).filter(l => LETTER_VALUES[l] === tier);
      lines.push(`  ${tier}-pt letters (${letters.join(',')}): ${dist[tier]} used`);
    }
  }

  lines.push('');
  lines.push('Scrabble letter values reference:');
  const byValue: Record<number, string[]> = {};
  for (const [letter, val] of Object.entries(LETTER_VALUES)) {
    if (!byValue[val]) byValue[val] = [];
    byValue[val].push(letter);
  }
  for (const v of Object.keys(byValue).map(Number).sort((a, b) => a - b)) {
    lines.push(`  ${v} pt: ${byValue[v].join(', ')}`);
  }

  return lines.join('\n');
}
