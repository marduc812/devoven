// Pure TypeScript — no browser APIs.
// Character-level and word-level diff using LCS.

export type DiffSegment = {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
};

export type DiffStats = {
  charsAdded: number;
  charsRemoved: number;
  wordsAdded: number;
  wordsRemoved: number;
  similarity: number; // 0-100 percent
};

// ─── LCS for arrays ──────────────────────────────────────────────────────────

function lcsLength(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

function traceback(dp: number[][], a: string[], b: string[], i: number, j: number, out: DiffSegment[]): void {
  if (i === 0 && j === 0) return;
  if (i === 0) {
    traceback(dp, a, b, i, j - 1, out);
    out.push({ type: 'added', text: b[j - 1] });
  } else if (j === 0) {
    traceback(dp, a, b, i - 1, j, out);
    out.push({ type: 'removed', text: a[i - 1] });
  } else if (a[i - 1] === b[j - 1]) {
    traceback(dp, a, b, i - 1, j - 1, out);
    out.push({ type: 'unchanged', text: a[i - 1] });
  } else if (dp[i - 1][j] >= dp[i][j - 1]) {
    traceback(dp, a, b, i - 1, j, out);
    out.push({ type: 'removed', text: a[i - 1] });
  } else {
    traceback(dp, a, b, i, j - 1, out);
    out.push({ type: 'added', text: b[j - 1] });
  }
}

// ─── Character-level diff ────────────────────────────────────────────────────

export function charDiff(original: string, revised: string): DiffSegment[] {
  // Limit to avoid stack overflow
  if (original.length > 2000 || revised.length > 2000) {
    return [{ type: 'unchanged', text: 'Input too large (max 2000 characters per side)' }];
  }

  const a = original.split('');
  const b = revised.split('');
  const dp = lcsLength(a, b);
  const result: DiffSegment[] = [];
  traceback(dp, a, b, a.length, b.length, result);

  // Merge consecutive segments of the same type
  const merged: DiffSegment[] = [];
  for (const seg of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1] = {
        type: seg.type,
        text: merged[merged.length - 1].text + seg.text,
      };
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

// ─── Word-level diff ─────────────────────────────────────────────────────────

export function wordDiff(original: string, revised: string): DiffSegment[] {
  const tokenize = (s: string): string[] => {
    // Split into words and whitespace tokens
    return s.match(/\S+|\s+/g) || [];
  };

  const a = tokenize(original);
  const b = tokenize(revised);

  if (a.length > 500 || b.length > 500) {
    return [{ type: 'unchanged', text: 'Input too large (max 500 tokens per side)' }];
  }

  const dp = lcsLength(a, b);
  const result: DiffSegment[] = [];
  traceback(dp, a, b, a.length, b.length, result);

  // Merge consecutive segments
  const merged: DiffSegment[] = [];
  for (const seg of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1] = {
        type: seg.type,
        text: merged[merged.length - 1].text + seg.text,
      };
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function diffStats(charSegments: DiffSegment[], wordSegments: DiffSegment[]): DiffStats {
  let charsAdded = 0;
  let charsRemoved = 0;
  let charsUnchanged = 0;

  for (const seg of charSegments) {
    if (seg.type === 'added') charsAdded += seg.text.length;
    else if (seg.type === 'removed') charsRemoved += seg.text.length;
    else charsUnchanged += seg.text.length;
  }

  let wordsAdded = 0;
  let wordsRemoved = 0;

  for (const seg of wordSegments) {
    const wc = seg.text.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (seg.type === 'added') wordsAdded += wc;
    else if (seg.type === 'removed') wordsRemoved += wc;
  }

  const total = charsAdded + charsRemoved + charsUnchanged * 2;
  const similarity = total === 0 ? 100 : Math.round((charsUnchanged * 2 / total) * 100);

  return { charsAdded, charsRemoved, wordsAdded, wordsRemoved, similarity };
}

// ─── Render to text notation ─────────────────────────────────────────────────

export function renderDiffToText(segments: DiffSegment[]): string {
  return segments.map(seg => {
    if (seg.type === 'added') return '[+' + seg.text + '+]';
    if (seg.type === 'removed') return '[-' + seg.text + '-]';
    return seg.text;
  }).join('');
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export function computeDiff(original: string, revised: string): string {
  if (!original && !revised) return '';

  const charSegs = charDiff(original, revised);
  const wordSegs = wordDiff(original, revised);
  const stats = diffStats(charSegs, wordSegs);

  const charView = renderDiffToText(charSegs);
  const wordView = renderDiffToText(wordSegs);

  return [
    '=== Character Diff ===',
    charView,
    '',
    '=== Word Diff ===',
    wordView,
    '',
    '=== Stats ===',
    `Characters added:   +${stats.charsAdded}`,
    `Characters removed: -${stats.charsRemoved}`,
    `Words added:        +${stats.wordsAdded}`,
    `Words removed:      -${stats.wordsRemoved}`,
    `Similarity:         ${stats.similarity}%`,
  ].join('\n');
}
