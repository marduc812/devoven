export type FrequencyEntry = {
  char: string;
  display: string;  // human-readable char name
  count: number;
  percent: number;
};

export function countFrequency(text: string, includeSpaces = true): FrequencyEntry[] {
  const map = new Map<string, number>();
  for (const ch of text) {
    if (!includeSpaces && ch === ' ') continue;
    map.set(ch, (map.get(ch) ?? 0) + 1);
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map.entries()]
    .map(([char, count]) => ({
      char,
      display: charDisplay(char),
      count,
      percent: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function charDisplay(ch: string): string {
  const code = ch.charCodeAt(0);
  if (ch === ' ') return 'SPACE';
  if (ch === '\n') return 'NEWLINE';
  if (ch === '\t') return 'TAB';
  if (ch === '\r') return 'CR';
  if (code < 32) return `CTRL-${code}`;
  return ch;
}

export type CharCategory = 'letter' | 'digit' | 'whitespace' | 'punctuation' | 'other';

export function classifyChar(ch: string): CharCategory {
  if (/\s/.test(ch)) return 'whitespace';
  if (/\p{L}/u.test(ch)) return 'letter';
  if (/\p{Nd}/u.test(ch)) return 'digit';
  // Math, currency and modifier symbols read as punctuation; emoji and other
  // pictographs (\p{So}) are left in their own bucket, where they are useful.
  if (/[\p{P}\p{Sm}\p{Sc}\p{Sk}]/u.test(ch)) return 'punctuation';
  return 'other';
}

export type FrequencyAnalysis = {
  entries: FrequencyEntry[];
  total: number;
  unique: number;
  categories: Array<{ name: CharCategory; count: number; percent: number }>;
  /** Counts for A–Z after folding case, whatever the case-folding option is. */
  letters: Array<{ letter: string; count: number; percent: number }>;
};

const CATEGORY_ORDER: CharCategory[] = ['letter', 'digit', 'whitespace', 'punctuation', 'other'];

export type FrequencyOptions = { ignoreCase?: boolean; ignoreWhitespace?: boolean };

export function analyzeText(text: string, options: FrequencyOptions = {}): FrequencyAnalysis {
  const prepared = options.ignoreCase ? text.toLowerCase() : text;
  const entries = countFrequency(
    options.ignoreWhitespace ? prepared.replace(/\s/g, '') : prepared,
  );
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  const byCategory = new Map<CharCategory, number>();
  for (const e of entries) {
    const cat = classifyChar(e.char);
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + e.count);
  }

  const letterTotals = new Map<string, number>();
  for (const e of entries) {
    const upper = e.char.toUpperCase();
    if (upper >= 'A' && upper <= 'Z' && upper.length === 1) {
      letterTotals.set(upper, (letterTotals.get(upper) ?? 0) + e.count);
    }
  }
  const letterSum = [...letterTotals.values()].reduce((a, b) => a + b, 0);

  return {
    entries,
    total,
    unique: entries.length,
    categories: CATEGORY_ORDER.filter(c => (byCategory.get(c) ?? 0) > 0).map(name => {
      const count = byCategory.get(name) as number;
      return { name, count, percent: total > 0 ? (count / total) * 100 : 0 };
    }),
    letters: Array.from({ length: 26 }, (_, i) => {
      const letter = String.fromCharCode(65 + i);
      const count = letterTotals.get(letter) ?? 0;
      return { letter, count, percent: letterSum > 0 ? (count / letterSum) * 100 : 0 };
    }),
  };
}

export function formatFrequency(entries: FrequencyEntry[]): string {
  if (entries.length === 0) return 'No characters found.';
  const header = 'Char     Count    Percent';
  const sep = '-'.repeat(30);
  const rows = entries.slice(0, 50).map(e =>
    `${e.display.padEnd(8)} ${String(e.count).padStart(6)}   ${e.percent.toFixed(2)}%`
  );
  return [header, sep, ...rows].join('\n');
}
