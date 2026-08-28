import {
  charDiff,
  wordDiff,
  diffStats,
  renderDiffToText,
  computeDiff,
} from '../Components/Functions/CharDiffTools/logic';

// ─── charDiff ─────────────────────────────────────────────────────────────────

describe('charDiff', () => {
  it('returns empty array for identical strings', () => {
    const result = charDiff('hello', 'hello');
    const types = result.map(s => s.type);
    expect(types.every(t => t === 'unchanged')).toBe(true);
  });

  it('marks inserted characters as added', () => {
    const result = charDiff('cat', 'cart');
    const added = result.filter(s => s.type === 'added').map(s => s.text).join('');
    expect(added).toBe('r');
  });

  it('marks deleted characters as removed', () => {
    const result = charDiff('cart', 'cat');
    const removed = result.filter(s => s.type === 'removed').map(s => s.text).join('');
    expect(removed).toBe('r');
  });

  it('returns unchanged segments for common substrings', () => {
    const result = charDiff('hello world', 'hello earth');
    const unchanged = result.filter(s => s.type === 'unchanged').map(s => s.text).join('');
    expect(unchanged).toContain('hello');
  });

  it('handles completely different strings', () => {
    const result = charDiff('abc', 'xyz');
    const removed = result.filter(s => s.type === 'removed').map(s => s.text).join('');
    const added = result.filter(s => s.type === 'added').map(s => s.text).join('');
    expect(removed).toBe('abc');
    expect(added).toBe('xyz');
  });

  it('handles empty original', () => {
    const result = charDiff('', 'hello');
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('added');
    expect(result[0].text).toBe('hello');
  });

  it('handles empty revised', () => {
    const result = charDiff('hello', '');
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('removed');
    expect(result[0].text).toBe('hello');
  });

  it('returns error message for very large inputs', () => {
    const big = 'a'.repeat(2001);
    const result = charDiff(big, 'hello');
    expect(result[0].type).toBe('unchanged');
    expect(result[0].text).toContain('too large');
  });
});

// ─── wordDiff ─────────────────────────────────────────────────────────────────

describe('wordDiff', () => {
  it('returns unchanged for identical text', () => {
    const result = wordDiff('hello world', 'hello world');
    const types = result.map(s => s.type);
    expect(types.every(t => t === 'unchanged')).toBe(true);
  });

  it('marks added words', () => {
    const result = wordDiff('hello world', 'hello beautiful world');
    const added = result.filter(s => s.type === 'added').map(s => s.text.trim()).join(' ');
    expect(added).toContain('beautiful');
  });

  it('marks removed words', () => {
    const result = wordDiff('hello beautiful world', 'hello world');
    const removed = result.filter(s => s.type === 'removed').map(s => s.text.trim()).join(' ');
    expect(removed).toContain('beautiful');
  });

  it('handles empty strings', () => {
    const result = wordDiff('', 'hello');
    const added = result.filter(s => s.type === 'added').map(s => s.text).join('');
    expect(added).toContain('hello');
  });
});

// ─── diffStats ────────────────────────────────────────────────────────────────

describe('diffStats', () => {
  it('returns 100% similarity for identical text', () => {
    const charSegs = charDiff('hello', 'hello');
    const wordSegs = wordDiff('hello', 'hello');
    const stats = diffStats(charSegs, wordSegs);
    expect(stats.similarity).toBe(100);
    expect(stats.charsAdded).toBe(0);
    expect(stats.charsRemoved).toBe(0);
  });

  it('counts added and removed chars correctly', () => {
    const charSegs = charDiff('cat', 'bat');
    const wordSegs = wordDiff('cat', 'bat');
    const stats = diffStats(charSegs, wordSegs);
    expect(stats.charsAdded).toBe(1);
    expect(stats.charsRemoved).toBe(1);
  });

  it('counts added words', () => {
    const charSegs = charDiff('hello world', 'hello beautiful world');
    const wordSegs = wordDiff('hello world', 'hello beautiful world');
    const stats = diffStats(charSegs, wordSegs);
    expect(stats.wordsAdded).toBeGreaterThan(0);
  });

  it('returns 0% similarity for completely different text', () => {
    const charSegs = charDiff('abc', 'xyz');
    const wordSegs = wordDiff('abc', 'xyz');
    const stats = diffStats(charSegs, wordSegs);
    expect(stats.similarity).toBe(0);
  });
});

// ─── renderDiffToText ─────────────────────────────────────────────────────────

describe('renderDiffToText', () => {
  it('wraps added segments in [++]', () => {
    const segs = [{ type: 'added' as const, text: 'hello' }];
    expect(renderDiffToText(segs)).toBe('[+hello+]');
  });

  it('wraps removed segments in [--]', () => {
    const segs = [{ type: 'removed' as const, text: 'world' }];
    expect(renderDiffToText(segs)).toBe('[-world-]');
  });

  it('passes unchanged segments through', () => {
    const segs = [{ type: 'unchanged' as const, text: 'same' }];
    expect(renderDiffToText(segs)).toBe('same');
  });

  it('combines multiple segments', () => {
    const segs = [
      { type: 'unchanged' as const, text: 'hello ' },
      { type: 'removed' as const, text: 'world' },
      { type: 'added' as const, text: 'earth' },
    ];
    expect(renderDiffToText(segs)).toBe('hello [-world-][+earth+]');
  });
});

// ─── computeDiff ──────────────────────────────────────────────────────────────

describe('computeDiff', () => {
  it('returns empty string for empty inputs', () => {
    expect(computeDiff('', '')).toBe('');
  });

  it('contains section headers', () => {
    const result = computeDiff('hello world', 'hello earth');
    expect(result).toContain('=== Character Diff ===');
    expect(result).toContain('=== Word Diff ===');
    expect(result).toContain('=== Stats ===');
  });

  it('shows similarity in stats', () => {
    const result = computeDiff('hello', 'hello');
    expect(result).toContain('100%');
  });

  it('shows additions and removals', () => {
    const result = computeDiff('cat', 'bat');
    expect(result).toContain('[+');
    expect(result).toContain('-]');
  });
});
