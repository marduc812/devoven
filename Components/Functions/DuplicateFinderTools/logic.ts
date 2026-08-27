export function findDuplicateWords(text: string): string {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

  const dupes = [...freq.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1]);

  if (dupes.length === 0) return 'No duplicate words found (3+ characters).';

  return `Found ${dupes.length} duplicate word(s):\n\n` +
    dupes.map(([w, c]) => `"${w}" × ${c}`).join('\n');
}

export function findDuplicateLines(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const freq = new Map<string, number>();
  for (const l of lines) freq.set(l, (freq.get(l) ?? 0) + 1);

  const dupes = [...freq.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1]);

  if (dupes.length === 0) return 'No duplicate lines found.';

  return `Found ${dupes.length} duplicate line(s):\n\n` +
    dupes.map(([l, c]) => `[×${c}] ${l.substring(0, 80)}`).join('\n');
}

export function findNearDuplicates(text: string, threshold = 0.5): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  const dupes: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const sim = jaccardSimilarity(lines[i], lines[j]);
      if (sim >= threshold && sim < 1.0) {
        dupes.push(`Similarity: ${Math.round(sim * 100)}%\n  A: ${lines[i].substring(0, 60)}\n  B: ${lines[j].substring(0, 60)}`);
      }
    }
    if (i > 50) break; // Performance limit
  }

  if (dupes.length === 0) return 'No near-duplicate lines found.';
  return `Found ${dupes.length} near-duplicate pair(s):\n\n${dupes.join('\n\n')}`;
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
