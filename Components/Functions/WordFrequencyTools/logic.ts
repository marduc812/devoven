export interface WordFreqResult {
  total: number;
  unique: number;
  topWords: Array<{ word: string; count: number; percent: string }>;
}

export function countWordFrequency(text: string): WordFreqResult {
  const words = text.toLowerCase().match(/\b[a-z']{2,}\b/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const total = words.length;
  return {
    total,
    unique: freq.size,
    topWords: sorted.slice(0, 50).map(([word, count]) => ({
      word,
      count,
      percent: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0',
    })),
  };
}

export function formatWordFrequency(result: WordFreqResult): string {
  if (result.total === 0) return 'No words found.';
  const header = `Total words: ${result.total}  |  Unique words: ${result.unique}\n${'─'.repeat(40)}\n`;
  const rows = result.topWords
    .map((w, i) => `${String(i + 1).padStart(3)}. ${w.word.padEnd(20)} ${String(w.count).padStart(5)}  (${w.percent}%)`)
    .join('\n');
  return header + rows;
}
