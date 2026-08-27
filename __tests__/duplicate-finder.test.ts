import {
  findDuplicateWords,
  findDuplicateLines,
  findNearDuplicates,
  jaccardSimilarity,
} from '../Components/Functions/DuplicateFinderTools/logic';

// ─── jaccardSimilarity ────────────────────────────────────────────────────────

describe('jaccardSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1);
  });
  it('returns 0 for completely different strings', () => {
    expect(jaccardSimilarity('foo bar', 'baz qux')).toBe(0);
  });
  it('returns partial similarity', () => {
    const sim = jaccardSimilarity('hello world', 'hello there');
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
  it('handles empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(0);
  });
  it('is symmetric', () => {
    const a = jaccardSimilarity('foo bar baz', 'foo bar qux');
    const b = jaccardSimilarity('foo bar qux', 'foo bar baz');
    expect(a).toBeCloseTo(b);
  });
});

// ─── findDuplicateWords ───────────────────────────────────────────────────────

describe('findDuplicateWords', () => {
  it('finds duplicate words', () => {
    const result = findDuplicateWords('the cat sat on the mat the cat');
    expect(result).toContain('duplicate word');
    expect(result).toContain('"the"');
    expect(result).toContain('"cat"');
  });
  it('ignores short words (< 3 chars)', () => {
    const result = findDuplicateWords('it is a a a');
    expect(result).toBe('No duplicate words found (3+ characters).');
  });
  it('returns no duplicates message for unique words', () => {
    const result = findDuplicateWords('hello world foo bar');
    expect(result).toBe('No duplicate words found (3+ characters).');
  });
  it('counts case-insensitively', () => {
    const result = findDuplicateWords('Hello hello HELLO');
    expect(result).toContain('"hello"');
    expect(result).toContain('× 3');
  });
  it('handles empty string', () => {
    const result = findDuplicateWords('');
    expect(result).toBe('No duplicate words found (3+ characters).');
  });
  it('sorts by frequency descending', () => {
    const result = findDuplicateWords('foo foo foo bar bar');
    const fooIdx = result.indexOf('"foo"');
    const barIdx = result.indexOf('"bar"');
    expect(fooIdx).toBeLessThan(barIdx);
  });
});

// ─── findDuplicateLines ───────────────────────────────────────────────────────

describe('findDuplicateLines', () => {
  it('finds duplicate lines', () => {
    const result = findDuplicateLines('hello\nworld\nhello\nworld\nhello');
    expect(result).toContain('duplicate line');
    expect(result).toContain('[×3] hello');
    expect(result).toContain('[×2] world');
  });
  it('returns no duplicates for unique lines', () => {
    const result = findDuplicateLines('line1\nline2\nline3');
    expect(result).toBe('No duplicate lines found.');
  });
  it('handles empty input', () => {
    const result = findDuplicateLines('');
    expect(result).toBe('No duplicate lines found.');
  });
  it('ignores blank lines', () => {
    const result = findDuplicateLines('hello\n\nhello\n\n');
    expect(result).toContain('[×2] hello');
  });
  it('trims line whitespace before comparing', () => {
    const result = findDuplicateLines('  hello  \nhello');
    expect(result).toContain('[×2] hello');
  });
});

// ─── findNearDuplicates ───────────────────────────────────────────────────────

describe('findNearDuplicates', () => {
  it('finds near-duplicate lines with custom threshold', () => {
    // 4/6 = 0.667 similarity, use 0.6 threshold to detect
    const result = findNearDuplicates('the quick brown fox jumps\nthe quick brown fox leaps\ncompletely different thing', 0.6);
    expect(result).toContain('near-duplicate');
    expect(result).toContain('Similarity:');
  });
  it('returns no duplicates for very different lines', () => {
    const result = findNearDuplicates('hello world today\nfoo bar baz qux');
    expect(result).toBe('No near-duplicate lines found.');
  });
  it('skips lines shorter than 6 chars', () => {
    const result = findNearDuplicates('hi\nhi\nhi');
    expect(result).toBe('No near-duplicate lines found.');
  });
  it('does not flag exact duplicates (sim < 1.0)', () => {
    const result = findNearDuplicates('exactly the same line here\nexactly the same line here');
    expect(result).toBe('No near-duplicate lines found.');
  });
  it('uses threshold parameter', () => {
    // With lower threshold, more matches
    const result = findNearDuplicates('hello world foo\nhello world bar', 0.5);
    expect(result).toContain('near-duplicate');
  });
});
