import {
  levenshtein,
  similarity,
  hammingDistance,
  formatLevenshtein,
  buildMatrix,
  editScript,
  countEditOps,
} from '@/Components/Functions/TextLevenshteinTools/logic';

describe('levenshtein', () => {
  it('identical strings → 0', () => expect(levenshtein('hello', 'hello')).toBe(0));
  it('empty to non-empty → length', () => expect(levenshtein('', 'abc')).toBe(3));
  it('non-empty to empty → length', () => expect(levenshtein('abc', '')).toBe(3));
  it('kitten → sitting → 3', () => expect(levenshtein('kitten', 'sitting')).toBe(3));
  it('one insertion', () => expect(levenshtein('cat', 'cats')).toBe(1));
  it('one deletion', () => expect(levenshtein('cats', 'cat')).toBe(1));
  it('one substitution', () => expect(levenshtein('cat', 'bat')).toBe(1));
});

describe('similarity', () => {
  it('identical strings → 1', () => expect(similarity('abc', 'abc')).toBe(1));
  it('empty strings → 1', () => expect(similarity('', '')).toBe(1));
  it('completely different → less than 1', () => expect(similarity('abc', 'xyz')).toBeLessThan(1));
});

describe('hammingDistance', () => {
  it('same length, 0 differences → 0', () => expect(hammingDistance('abc', 'abc')).toBe(0));
  it('same length, 1 difference → 1', () => expect(hammingDistance('abc', 'axc')).toBe(1));
  it('different lengths → null', () => expect(hammingDistance('ab', 'abc')).toBeNull());
});

describe('formatLevenshtein', () => {
  it('includes edit distance in output', () => expect(formatLevenshtein('kitten', 'sitting')).toContain('3'));
  it('includes similarity percentage', () => expect(formatLevenshtein('hello', 'hello')).toContain('100.0%'));
  it('shows matrix for short strings', () => expect(formatLevenshtein('cat', 'bat')).toContain('matrix'));
  it('shows hamming when equal length', () => expect(formatLevenshtein('abc', 'xyz')).toContain('Hamming'));
  it('throws for two empty strings', () => expect(() => formatLevenshtein('', '')).toThrow());
});

/** Replay an edit script over A and check it lands on B. */
function applyScript(a: string, b: string): string {
  return editScript(a, b)
    .ops.filter(op => op.type !== 'delete')
    .map(op => op.b)
    .join('');
}

describe('editScript', () => {
  it('turns kitten into sitting', () => expect(applyScript('kitten', 'sitting')).toBe('sitting'));
  it('replaying the script reproduces B for a range of pairs', () => {
    const pairs: Array<[string, string]> = [
      ['', 'abc'], ['abc', ''], ['abc', 'abc'], ['flaw', 'lawn'],
      ['sunday', 'saturday'], ['a', 'bbbb'], ['intention', 'execution'],
    ];
    for (const [a, b] of pairs) expect(applyScript(a, b)).toBe(b);
  });
  it('the surviving characters of A read back in order', () => {
    const kept = editScript('sunday', 'saturday')
      .ops.filter(op => op.type !== 'insert')
      .map(op => op.a)
      .join('');
    expect(kept).toBe('sunday');
  });
  it('non-matching operations number exactly the edit distance', () => {
    const { ops } = editScript('intention', 'execution');
    expect(ops.filter(op => op.type !== 'match').length).toBe(levenshtein('intention', 'execution'));
  });
  it('identical strings produce only matches', () => {
    expect(editScript('same', 'same').ops.every(op => op.type === 'match')).toBe(true);
  });
  it('an empty A gives nothing but insertions', () => {
    const { ops } = editScript('', 'abc');
    expect(ops).toHaveLength(3);
    expect(ops.every(op => op.type === 'insert')).toBe(true);
  });
  it('an empty B gives nothing but deletions', () => {
    expect(editScript('abc', '').ops.every(op => op.type === 'delete')).toBe(true);
  });
  it('two empty strings need no edits', () => expect(editScript('', '').ops).toHaveLength(0));
  it('marks inserted characters as coming only from B', () => {
    const insert = editScript('cat', 'cats').ops.find(op => op.type === 'insert')!;
    expect(insert.a).toBeNull();
    expect(insert.b).toBe('s');
  });
  it('marks deleted characters as coming only from A', () => {
    const del = editScript('cats', 'cat').ops.find(op => op.type === 'delete')!;
    expect(del.a).toBe('s');
    expect(del.b).toBeNull();
  });
  it('path starts at the answer cell and ends at the origin', () => {
    const { path } = editScript('kitten', 'sitting');
    expect(path[0]).toBe('6,7');
    expect(path[path.length - 1]).toBe('0,0');
  });
  it('path steps only to adjacent cells', () => {
    const { path } = editScript('sunday', 'saturday');
    for (let k = 1; k < path.length; k++) {
      const [i, j] = path[k - 1].split(',').map(Number);
      const [pi, pj] = path[k].split(',').map(Number);
      expect(i - pi).toBeLessThanOrEqual(1);
      expect(j - pj).toBeLessThanOrEqual(1);
      expect(i - pi + (j - pj)).toBeGreaterThan(0);
    }
  });
  it('every path cell exists in the matrix', () => {
    const a = 'flaw', b = 'lawn';
    const matrix = buildMatrix(a, b);
    for (const cell of editScript(a, b).path) {
      const [i, j] = cell.split(',').map(Number);
      expect(matrix[i][j]).toBeDefined();
    }
  });
});

describe('countEditOps', () => {
  it('counts the three substitutions and insertion in kitten → sitting', () => {
    expect(countEditOps('kitten', 'sitting')).toEqual({ ins: 1, del: 0, sub: 2, match: 4 });
  });
  it('insertions plus deletions plus substitutions equal the distance', () => {
    const ops = countEditOps('sunday', 'saturday');
    expect(ops.ins + ops.del + ops.sub).toBe(levenshtein('sunday', 'saturday'));
  });
  it('identical strings are all matches', () => {
    expect(countEditOps('abc', 'abc')).toEqual({ ins: 0, del: 0, sub: 0, match: 3 });
  });
});

describe('levenshtein on long input', () => {
  // The distance keeps two rows rather than the full m x n matrix, so a long
  // pair costs O(min(m, n)) memory instead of tens of millions of cells.
  it('compares a few thousand characters', () => {
    expect(levenshtein('a'.repeat(1200), 'b'.repeat(1200))).toBe(1200);
    expect(levenshtein('a'.repeat(1200), 'a'.repeat(1199))).toBe(1);
    expect(levenshtein('ab'.repeat(600), 'ab'.repeat(600))).toBe(0);
  });
});
