// Pure TypeScript — no browser APIs, no React.
// Line-by-line LCS diff algorithm.

export type DiffLine = {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
};

// Build LCS table
function buildLcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  // Use 1D rolling array for memory efficiency
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

function backtrack(dp: number[][], a: string[], b: string[], i: number, j: number): DiffLine[] {
  if (i === 0 && j === 0) return [];
  if (i === 0) {
    return [...backtrack(dp, a, b, i, j - 1), { type: 'added', text: b[j - 1] }];
  }
  if (j === 0) {
    return [...backtrack(dp, a, b, i - 1, j), { type: 'removed', text: a[i - 1] }];
  }
  if (a[i - 1] === b[j - 1]) {
    return [...backtrack(dp, a, b, i - 1, j - 1), { type: 'unchanged', text: a[i - 1] }];
  }
  if (dp[i - 1][j] >= dp[i][j - 1]) {
    return [...backtrack(dp, a, b, i - 1, j), { type: 'removed', text: a[i - 1] }];
  }
  return [...backtrack(dp, a, b, i, j - 1), { type: 'added', text: b[j - 1] }];
}

export function diffTexts(input: string): DiffLine[] {
  if (!input.trim()) return [];

  const sepIdx = input.split('\n').findIndex((l) => l.trim() === '---');
  if (sepIdx === -1) {
    return [{ type: 'unchanged', text: 'Separate two texts with a line containing only ---' }];
  }

  const lines = input.split('\n');
  const aLines = lines.slice(0, sepIdx);
  const bLines = lines.slice(sepIdx + 1);

  // For large inputs, limit to avoid stack overflow in recursive backtrack
  if (aLines.length > 500 || bLines.length > 500) {
    return [{ type: 'unchanged', text: 'Input too large (max 500 lines per side)' }];
  }

  const dp = buildLcs(aLines, bLines);
  return backtrack(dp, aLines, bLines, aLines.length, bLines.length);
}

export function diffTwoTexts(text1: string, text2: string): DiffLine[] {
  if (!text1 && !text2) return [];

  const aLines = text1.split('\n');
  const bLines = text2.split('\n');

  if (aLines.length > 500 || bLines.length > 500) {
    return [{ type: 'unchanged', text: 'Input too large (max 500 lines per side)' }];
  }

  const dp = buildLcs(aLines, bLines);
  return backtrack(dp, aLines, bLines, aLines.length, bLines.length);
}

export function diffToString(lines: DiffLine[]): string {
  return lines
    .map((l) => {
      if (l.type === 'added') return '+ ' + l.text;
      if (l.type === 'removed') return '- ' + l.text;
      return '  ' + l.text;
    })
    .join('\n');
}

export type WordSpan = {
  type: 'same' | 'diff';
  text: string;
};

export function inlineWordDiff(a: string, b: string): { aSpans: WordSpan[]; bSpans: WordSpan[] } {
  const aTokens = a.split('');
  const bTokens = b.split('');

  if (aTokens.length > 500 || bTokens.length > 500) {
    return { aSpans: [{ type: 'diff', text: a }], bSpans: [{ type: 'diff', text: b }] };
  }

  const m = aTokens.length, n = bTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = aTokens[i - 1] === bTokens[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const aResult: WordSpan[] = [];
  const bResult: WordSpan[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i === 0) {
      bResult.unshift({ type: 'diff', text: bTokens[--j] });
    } else if (j === 0) {
      aResult.unshift({ type: 'diff', text: aTokens[--i] });
    } else if (aTokens[i - 1] === bTokens[j - 1]) {
      aResult.unshift({ type: 'same', text: aTokens[i - 1] });
      bResult.unshift({ type: 'same', text: bTokens[j - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      aResult.unshift({ type: 'diff', text: aTokens[--i] });
    } else {
      bResult.unshift({ type: 'diff', text: bTokens[--j] });
    }
  }

  return { aSpans: mergeSpans(aResult), bSpans: mergeSpans(bResult) };
}

function mergeSpans(spans: WordSpan[]): WordSpan[] {
  return spans.reduce<WordSpan[]>((acc, span) => {
    const last = acc[acc.length - 1];
    if (last && last.type === span.type) { last.text += span.text; return acc; }
    acc.push({ ...span });
    return acc;
  }, []);
}
