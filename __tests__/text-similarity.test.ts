import {
  jaccardSimilarity,
  cosineSimilarity,
  editDistance,
  editDistanceSimilarity,
  lcsSimilarity,
  charSimilarity,
  computeSimilarity,
  formatSimilarityOutput,
} from '@/Components/Functions/TextSimilarityTools/logic';

describe('jaccardSimilarity', () => {
  it('returns 1 for identical texts', () => {
    expect(jaccardSimilarity('the cat sat', 'the cat sat')).toBeCloseTo(1);
  });

  it('returns 0 for completely different texts', () => {
    expect(jaccardSimilarity('apple orange', 'banana grape')).toBe(0);
  });

  it('returns value between 0 and 1', () => {
    const s = jaccardSimilarity('the quick brown fox', 'the slow red dog');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('returns 1 for two empty strings', () => {
    expect(jaccardSimilarity('', '')).toBe(1);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical texts', () => {
    expect(cosineSimilarity('the cat sat', 'the cat sat')).toBeCloseTo(1);
  });

  it('returns 0 for empty vs non-empty', () => {
    expect(cosineSimilarity('', 'hello')).toBe(0);
  });

  it('returns value between 0 and 1', () => {
    const s = cosineSimilarity('hello world', 'hello there');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(editDistance('kitten', 'kitten')).toBe(0);
  });

  it('returns correct distance for kitten/sitting', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3);
  });

  it('returns string length for empty vs non-empty', () => {
    expect(editDistance('', 'hello')).toBe(5);
  });
});

describe('editDistanceSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(editDistanceSimilarity('hello', 'hello')).toBe(1);
  });

  it('returns value between 0 and 1', () => {
    const s = editDistanceSimilarity('kitten', 'sitting');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

describe('lcsSimilarity', () => {
  it('returns 1 for identical texts', () => {
    expect(lcsSimilarity('the cat sat', 'the cat sat')).toBeCloseTo(1);
  });

  it('returns 0 for empty texts', () => {
    expect(lcsSimilarity('hello', '')).toBe(0);
  });
});

describe('charSimilarity', () => {
  it('returns high value for similar strings', () => {
    expect(charSimilarity('hello', 'helo')).toBeGreaterThan(0.5);
  });

  it('returns 0 for completely different short strings', () => {
    expect(charSimilarity('ab', 'zy')).toBe(0);
  });
});

describe('computeSimilarity', () => {
  it('returns all five scores', () => {
    const r = computeSimilarity('hello world', 'hello there');
    expect(r.jaccard).toBeDefined();
    expect(r.cosine).toBeDefined();
    expect(r.editDistSimilarity).toBeDefined();
    expect(r.lcsSimilarity).toBeDefined();
    expect(r.charSimilarity).toBeDefined();
    expect(r.overallEstimate).toBeDefined();
  });

  it('overall estimate is between 0 and 1', () => {
    const r = computeSimilarity('foo bar baz', 'qux quux corge');
    expect(r.overallEstimate).toBeGreaterThanOrEqual(0);
    expect(r.overallEstimate).toBeLessThanOrEqual(1);
  });
});

describe('formatSimilarityOutput', () => {
  it('prompts for separator when missing', () => {
    expect(formatSimilarityOutput('just one block')).toContain('---');
  });

  it('shows all metric names for valid input', () => {
    const input = 'The quick brown fox\n---\nThe slow brown dog';
    const out = formatSimilarityOutput(input);
    expect(out).toContain('Jaccard');
    expect(out).toContain('Cosine');
    expect(out).toContain('Edit Distance');
    expect(out).toContain('LCS');
    expect(out).toContain('Bigram');
  });

  it('returns prompt for empty input', () => {
    expect(formatSimilarityOutput('')).toContain('---');
  });
});
