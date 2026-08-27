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

function charLabel(ch: string): string {
  if (ch === ' ') return '(space)';
  if (ch === '\n') return '(newline)';
  if (ch === '\t') return '(tab)';
  const code = ch.charCodeAt(0);
  if (code < 32) return `(ctrl-${code})`;
  return `'${ch}'`;
}

function buildBarChart(entries: Array<[string, number]>, total: number, barWidth: number): string[] {
  const lines: string[] = [];
  const maxCount = entries.reduce((m, [, c]) => Math.max(m, c), 0);
  for (const [ch, count] of entries) {
    const pct = (count / total) * 100;
    const barLen = maxCount > 0 ? Math.round((count / maxCount) * barWidth) : 0;
    const bar = '█'.repeat(barLen);
    const label = charLabel(ch).padEnd(10);
    lines.push(`${label} ${bar.padEnd(barWidth)} ${count.toString().padStart(5)} (${pct.toFixed(1)}%)`);
  }
  return lines;
}

export function calculateTextEntropy(input: string): string {
  if (!input) throw new Error('Enter some text to analyze');

  const entropy = shannonEntropy(input);
  const uniqueChars = new Set(input).size;
  const maxEntropy = uniqueChars > 0 ? Math.log2(uniqueChars) : 0;
  const totalBits = entropy * input.length;

  let assessment: string;
  if (entropy < 1.5) assessment = 'Very low — highly repetitive or structured';
  else if (entropy < 3.0) assessment = 'Low — simple structured text';
  else if (entropy < 4.5) assessment = 'Moderate — typical English prose (~3.5–4.5 bits/char)';
  else if (entropy < 6.0) assessment = 'High — mixed or compressed content';
  else if (entropy < 7.0) assessment = 'Very high — random-looking or encoded';
  else assessment = 'Near-maximum — highly random or encrypted';

  const freq = new Map<string, number>();
  for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1);

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const top10 = sorted.slice(0, 10);
  const bottom5 = sorted.slice(-5).reverse();

  const BAR_WIDTH = 20;

  const lines: string[] = [
    `Length:           ${input.length} character${input.length !== 1 ? 's' : ''}`,
    `Unique chars:     ${uniqueChars}`,
    `Shannon entropy:  ${entropy.toFixed(4)} bits/char`,
    `Max entropy:      ${maxEntropy.toFixed(4)} bits/char (if uniform)`,
    `Total bits:       ${totalBits.toFixed(1)} bits`,
    `Assessment:       ${assessment}`,
    '',
    'Entropy benchmarks:',
    '  English text:   ~3.5–4.5 bits/char',
    '  Random ASCII:   ~6.5 bits/char',
    '  Truly random:   ~8.0 bits/char (256 symbols)',
    '',
  ];

  if (top10.length > 0) {
    lines.push(`Top ${top10.length} most frequent characters (bar chart):`);
    lines.push(`${'─'.repeat(50)}`);
    for (const barLine of buildBarChart(top10, input.length, BAR_WIDTH)) {
      lines.push(barLine);
    }
  }

  if (bottom5.length > 0 && sorted.length > top10.length) {
    lines.push('');
    lines.push(`Least frequent characters:`);
    lines.push(`${'─'.repeat(50)}`);
    for (const [ch, count] of bottom5) {
      const pct = (count / input.length) * 100;
      lines.push(`${charLabel(ch).padEnd(10)} ${count}x (${pct.toFixed(2)}%)`);
    }
  }

  return lines.join('\n');
}
