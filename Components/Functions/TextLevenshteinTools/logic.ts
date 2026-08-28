/**
 * The distance alone needs two rows, not the whole matrix: each cell only ever
 * reads the one above, the one to the left, and the diagonal. `buildMatrix`
 * below keeps the full grid because the traceback and the drawing need it.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Uint32Array(n + 1);
  let curr = new Uint32Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      if (ca === b.charCodeAt(j - 1)) curr[j] = prev[j - 1];
      else curr[j] = 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    const done = prev;
    prev = curr;
    curr = done;
  }

  return prev[n];
}

export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export function hammingDistance(a: string, b: string): number | null {
  if (a.length !== b.length) return null;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export function buildMatrix(a: string, b: string): number[][] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp;
}

export type EditOpType = 'match' | 'substitute' | 'insert' | 'delete';

export type EditOp = {
  type: EditOpType;
  /** The character taken from A, or null when B gains one. */
  a: string | null;
  /** The character written into B, or null when A loses one. */
  b: string | null;
};

export type EditScript = {
  ops: EditOp[];
  /** The `i,j` cells the traceback walks through, for highlighting the matrix. */
  path: string[];
};

/**
 * Walk the matrix back from the bottom-right corner to recover one cheapest
 * sequence of edits. Ties are broken toward substitution, then insertion, which
 * keeps matching runs aligned rather than scattered.
 */
export function editScript(a: string, b: string): EditScript {
  const dp = buildMatrix(a, b);
  const ops: EditOp[] = [];
  let i = a.length, j = b.length;
  const path: string[] = [`${i},${j}`];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: 'match', a: a[i - 1], b: b[j - 1] });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ type: 'substitute', a: a[i - 1], b: b[j - 1] });
      i--; j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.push({ type: 'insert', a: null, b: b[j - 1] });
      j--;
    } else {
      ops.push({ type: 'delete', a: a[i - 1], b: null });
      i--;
    }
    path.push(`${i},${j}`);
  }

  return { ops: ops.reverse(), path };
}

export function countEditOps(a: string, b: string): { ins: number; del: number; sub: number; match: number } {
  const { ops } = editScript(a, b);
  return {
    ins: ops.filter(o => o.type === 'insert').length,
    del: ops.filter(o => o.type === 'delete').length,
    sub: ops.filter(o => o.type === 'substitute').length,
    match: ops.filter(o => o.type === 'match').length,
  };
}

function renderMatrix(a: string, b: string, dp: number[][]): string {
  const header = '    ' + ['', ...b.split('')].map(c => (c || ' ').padStart(3)).join('');
  const rows = ['   ' + header];
  for (let i = 0; i <= a.length; i++) {
    const label = (i === 0 ? ' ' : a[i - 1]).padEnd(2);
    const row = dp[i].map(v => String(v).padStart(3)).join('');
    rows.push(`   ${label}${row}`);
  }
  return rows.join('\n');
}

export function formatLevenshtein(a: string, b: string): string {
  if (a === '' && b === '') throw new Error('Enter two strings — one per line');
  const dist = levenshtein(a, b);
  const sim = similarity(a, b);
  const ops = countEditOps(a, b);
  const hamming = hammingDistance(a, b);

  const lines: string[] = [
    `String A:       "${a}"`,
    `String B:       "${b}"`,
    '',
    `Edit distance:  ${dist}`,
    `Similarity:     ${(sim * 100).toFixed(1)}%`,
    '',
    `Operations:`,
    `  Insertions:   ${ops.ins}`,
    `  Deletions:    ${ops.del}`,
    `  Substitutions:${ops.sub}`,
  ];

  if (hamming !== null) {
    lines.push('');
    lines.push(`Hamming distance: ${hamming} (strings are equal length)`);
    lines.push('  (Hamming only counts positions that differ, no gaps)');
  }

  if (a.length <= 20 && b.length <= 20) {
    lines.push('');
    lines.push('Dynamic programming matrix:');
    const dp = buildMatrix(a, b);
    lines.push(renderMatrix(a, b, dp));
  }

  return lines.join('\n');
}
