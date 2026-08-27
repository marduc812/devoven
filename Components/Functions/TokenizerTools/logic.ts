export function tokenizeWords(text: string): string[] {
  return text.match(/\b\w+\b/g) ?? [];
}

export function tokenizeSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

export function tokenizeParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

export function tokenizeLines(text: string): string[] {
  return text.split('\n');
}

export type TokenMode = 'words' | 'sentences' | 'paragraphs' | 'lines';

export const TOKEN_MODES: TokenMode[] = ['words', 'sentences', 'paragraphs', 'lines'];

export interface TokenizeResult {
  mode: TokenMode;
  tokens: string[];
  count: number;
  /** Distinct tokens, compared case-insensitively. */
  uniqueCount: number;
  shortest: string | null;
  longest: string | null;
  averageLength: number;
  totalChars: number;
  /** Most common tokens first, then alphabetical. Case-folded. */
  frequency: Array<{ token: string; count: number }>;
}

export function tokenize(text: string, mode: TokenMode): string[] {
  switch (mode) {
    case 'words':
      return tokenizeWords(text);
    case 'sentences':
      return tokenizeSentences(text);
    case 'paragraphs':
      return tokenizeParagraphs(text);
    case 'lines':
      return tokenizeLines(text);
  }
}

export function tokenizeResult(text: string, mode: TokenMode): TokenizeResult {
  const tokens = tokenize(text, mode);

  const counts = new Map<string, number>();
  for (const t of tokens) {
    const key = t.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const frequency = [...counts.entries()]
    .map(([token, count]) => ({ token, count }))
    .sort((x, y) => y.count - x.count || x.token.localeCompare(y.token));

  const totalChars = tokens.reduce((sum, t) => sum + t.length, 0);

  // Ties resolve to the first occurrence, which reads more predictably than last.
  let shortest: string | null = null;
  let longest: string | null = null;
  for (const t of tokens) {
    if (shortest === null || t.length < shortest.length) shortest = t;
    if (longest === null || t.length > longest.length) longest = t;
  }

  return {
    mode,
    tokens,
    count: tokens.length,
    uniqueCount: counts.size,
    shortest,
    longest,
    averageLength: tokens.length === 0 ? 0 : totalChars / tokens.length,
    totalChars,
    frequency,
  };
}
