import { checkText, formatHomophoneOutput, HOMOPHONE_PAIRS } from '@/Components/Functions/HomophoneTools/logic';

describe('checkText', () => {
  it('finds "their" in text', () => {
    const matches = checkText('I went to their house');
    expect(matches.some(m => m.word.toLowerCase() === 'their')).toBe(true);
  });

  it('finds "there" in text', () => {
    const matches = checkText('Put it there');
    expect(matches.some(m => m.word.toLowerCase() === 'there')).toBe(true);
  });

  it('finds "effect" in text', () => {
    const matches = checkText('The effect was clear');
    expect(matches.some(m => m.word.toLowerCase() === 'effect')).toBe(true);
  });

  it('finds multiple confusables in a sentence', () => {
    const matches = checkText('Their affect on you is good');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for plain text with no confusables', () => {
    const matches = checkText('hello world');
    expect(matches.length).toBe(0);
  });

  it('returns empty for empty input', () => {
    expect(checkText('')).toHaveLength(0);
  });

  it('includes explanation in pair', () => {
    const matches = checkText('their house');
    const first = matches[0];
    expect(first.pair.explanation.length).toBeGreaterThan(0);
  });
});

describe('formatHomophoneOutput', () => {
  it('returns empty string for empty input', () => {
    expect(formatHomophoneOutput('')).toBe('');
  });

  it('includes "No commonly confused" when no matches', () => {
    expect(formatHomophoneOutput('hello world')).toContain('No commonly confused');
  });

  it('lists found words when confusables detected', () => {
    const out = formatHomophoneOutput('Their dog is loose');
    expect(out).toContain('group');
    expect(out).toContain('Explanation');
  });
});

describe('HOMOPHONE_PAIRS', () => {
  it('has more than 80 pairs', () => {
    expect(HOMOPHONE_PAIRS.length).toBeGreaterThan(80);
  });

  it('each pair has words and explanation', () => {
    for (const pair of HOMOPHONE_PAIRS) {
      expect(pair.words.length).toBeGreaterThan(1);
      expect(pair.explanation.length).toBeGreaterThan(0);
    }
  });
});
