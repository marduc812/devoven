import {
  findAnagramsOf,
  findRhymes,
  findAlliterations,
  findWordsWithin,
  formatWordplayOutput,
} from '@/Components/Functions/WordplayTools/logic';

describe('findAnagramsOf', () => {
  it('finds anagram of "cat" (act, tar, etc.)', () => {
    const result = findAnagramsOf('cat');
    expect(result.map(w => w.toLowerCase())).toContain('act');
  });

  it('returns empty for empty input', () => {
    expect(findAnagramsOf('')).toHaveLength(0);
  });

  it('does not include the word itself', () => {
    const result = findAnagramsOf('cat');
    expect(result.map(w => w.toLowerCase())).not.toContain('cat');
  });
});

describe('findRhymes', () => {
  it('finds words ending in "at" for "cat"', () => {
    const result = findRhymes('cat', 2);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(w => w.endsWith('at'))).toBe(true);
  });

  it('returns empty for very short word with long suffix', () => {
    expect(findRhymes('a', 3)).toHaveLength(0);
  });

  it('does not include the word itself', () => {
    const result = findRhymes('cat', 2);
    expect(result.map(w => w.toLowerCase())).not.toContain('cat');
  });
});

describe('findAlliterations', () => {
  it('finds words starting with "c" for "cat"', () => {
    const result = findAlliterations('cat');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(w => w[0].toLowerCase() === 'c')).toBe(true);
  });

  it('returns empty for empty word', () => {
    expect(findAlliterations('')).toHaveLength(0);
  });
});

describe('findWordsWithin', () => {
  it('finds "car" within "carpet"', () => {
    const result = findWordsWithin('carpet');
    expect(result.map(w => w.toLowerCase())).toContain('car');
  });

  it('returns empty for very short words', () => {
    expect(findWordsWithin('ab')).toHaveLength(0);
  });

  it('does not return the word itself', () => {
    const result = findWordsWithin('cat');
    expect(result.map(w => w.toLowerCase())).not.toContain('cat');
  });
});

describe('formatWordplayOutput', () => {
  it('shows prompt for empty input', () => {
    expect(formatWordplayOutput('')).toContain('Enter a word');
  });

  it('shows palindrome check result', () => {
    const out = formatWordplayOutput('racecar');
    expect(out).toContain('Palindrome check');
    expect(out).toContain('YES');
  });

  it('shows "No" palindrome for non-palindrome', () => {
    const out = formatWordplayOutput('hello');
    expect(out).toContain('No');
  });

  it('shows anagram section', () => {
    const out = formatWordplayOutput('listen');
    expect(out).toContain('Anagram');
  });

  it('includes reversed word', () => {
    const out = formatWordplayOutput('cat');
    expect(out).toContain('tac');
  });
});
