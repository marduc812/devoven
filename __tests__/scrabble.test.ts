import {
  scoreWord,
  extractWords,
  scoreAllWords,
  getValueDistribution,
  formatScrabbleOutput,
  LETTER_VALUES,
} from '@/Components/Functions/ScrabbleTools/logic';

describe('LETTER_VALUES', () => {
  it('has all 26 letters', () => {
    expect(Object.keys(LETTER_VALUES).length).toBe(26);
  });
  it('Q and Z are worth 10', () => {
    expect(LETTER_VALUES['Q']).toBe(10);
    expect(LETTER_VALUES['Z']).toBe(10);
  });
  it('E is worth 1', () => {
    expect(LETTER_VALUES['E']).toBe(1);
  });
});

describe('scoreWord', () => {
  it('scores QUIZ correctly (Q=10, U=1, I=1, Z=10)', () => {
    const ws = scoreWord('QUIZ');
    expect(ws.total).toBe(22);
  });
  it('scores lowercase same as uppercase', () => {
    const ws1 = scoreWord('hello');
    const ws2 = scoreWord('HELLO');
    expect(ws1.total).toBe(ws2.total);
  });
  it('returns per-letter breakdown', () => {
    const ws = scoreWord('AB');
    expect(ws.letters[0]).toEqual({ letter: 'A', value: 1 });
    expect(ws.letters[1]).toEqual({ letter: 'B', value: 3 });
  });
  it('returns total of 0 for numbers/symbols', () => {
    const ws = scoreWord('123');
    expect(ws.total).toBe(0);
  });
});

describe('extractWords', () => {
  it('extracts words from text', () => {
    expect(extractWords('hello world')).toEqual(['hello', 'world']);
  });
  it('handles punctuation', () => {
    expect(extractWords('foo, bar!')).toEqual(['foo', 'bar']);
  });
  it('returns empty for no letters', () => {
    expect(extractWords('123 456')).toEqual([]);
  });
});

describe('scoreAllWords', () => {
  it('returns words sorted by score descending', () => {
    const scored = scoreAllWords('quiz hello');
    expect(scored[0].word).toBe('quiz');
    expect(scored[0].total).toBeGreaterThan(scored[1].total);
  });
});

describe('getValueDistribution', () => {
  it('counts letter tiers', () => {
    const dist = getValueDistribution('AAABQ'); // A=1, B=3, Q=10
    expect(dist[1]).toBe(3); // 3 A's
    expect(dist[3]).toBe(1); // 1 B
    expect(dist[10]).toBe(1); // 1 Q
  });
  it('ignores non-letters', () => {
    const dist = getValueDistribution('A123');
    expect(dist[1]).toBe(1);
    expect(Object.keys(dist).length).toBe(1);
  });
});

describe('formatScrabbleOutput', () => {
  it('returns empty for empty input', () => {
    expect(formatScrabbleOutput('')).toBe('');
    expect(formatScrabbleOutput('   ')).toBe('');
  });
  it('shows score for single word', () => {
    const result = formatScrabbleOutput('QUIZ');
    expect(result).toContain('Total score: 22');
  });
  it('shows top-scoring words for multiple words', () => {
    const result = formatScrabbleOutput('quiz hello world');
    expect(result).toContain('Top-scoring words');
  });
  it('shows letter value reference', () => {
    const result = formatScrabbleOutput('test');
    expect(result).toContain('Scrabble letter values reference');
  });
  it('returns message for no-letter input', () => {
    const result = formatScrabbleOutput('123 456');
    expect(result).toContain('No words found');
  });
});
