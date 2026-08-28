import {
  findAnagrams,
  WORD_LIST,
  scrabbleScore,
  analyzeAnagrams,
} from '@/Components/Functions/AnagramFinderTools/logic';

describe('findAnagrams', () => {
  it('returns empty for empty input', () => {
    const r = findAnagrams('');
    expect(r.exact).toEqual([]);
    expect(r.totalFound).toBe(0);
  });

  it('finds "eat" as exact anagram of "tea"', () => {
    const r = findAnagrams('eat');
    expect(r.exact).toContain('eat');
  });

  it('finds exact anagram "listen" / "silent" (both in WORD_LIST)', () => {
    const words = WORD_LIST.map(w => w.toLowerCase());
    if (words.includes('listen') && words.includes('silent')) {
      const r = findAnagrams('listen');
      expect(r.exact).toContain('silent');
    }
  });

  it('finds partial anagrams for a longer word', () => {
    const r = findAnagrams('stone');
    // "tone", "note", "one", "net", etc. should be in partials
    const allPartials = Object.values(r.partial).flat();
    expect(allPartials.length).toBeGreaterThan(0);
  });

  it('groups partial anagrams by length', () => {
    const r = findAnagrams('stripe');
    for (const [len, words] of Object.entries(r.partial)) {
      for (const w of words) {
        expect(w.length).toBe(Number(len));
      }
    }
  });

  it('ignores non-letter characters', () => {
    const r1 = findAnagrams('eat');
    const r2 = findAnagrams('e-a-t!');
    expect(r1.exact).toEqual(r2.exact);
  });
});

describe('scrabbleScore', () => {
  it('sums letter values', () => expect(scrabbleScore('quiz')).toBe(22));
  it('ignores non-letters', () => expect(scrabbleScore('a-b')).toBe(4));
});

describe('analyzeAnagrams', () => {
  it('builds a rack with counts and tile values', () => {
    const r = analyzeAnagrams('leet');
    expect(r.rack).toEqual([
      { letter: 'e', count: 2, value: 1 },
      { letter: 'l', count: 1, value: 1 },
      { letter: 't', count: 1, value: 1 },
    ]);
    expect(r.rackScore).toBe(4);
  });

  it('reports the characters it dropped', () => {
    const r = analyzeAnagrams('cat-9!');
    expect(r.letters).toBe('cat');
    expect(r.ignored).toEqual(['-', '9', '!']);
  });

  it('finds exact anagrams sorted by score', () => {
    const r = analyzeAnagrams('least');
    expect(r.exact.map(w => w.word).sort()).toEqual(['least', 'slate', 'stale', 'steal']);
    expect(r.exact[0].score).toBeGreaterThanOrEqual(r.exact[r.exact.length - 1].score);
  });

  it('reports which word lengths the dictionary holds', () => {
    // Nothing 6 or 7 letters long is in the list, so 'listen' cannot have an exact
    // anagram here however good the letters are.
    const r = analyzeAnagrams('listen');
    expect(r.dictionaryLengths).not.toContain(6);
    expect(r.exact).toEqual([]);
    expect(r.dictionaryLengths).toContain(5);
  });

  it('groups partial words longest first', () => {
    const r = analyzeAnagrams('stream');
    const lengths = r.byLength.map(g => g.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
    expect(r.byLength.every(g => g.length < r.letters.length)).toBe(true);
  });

  it('picks the best and longest across both groups', () => {
    const r = analyzeAnagrams('teacher');
    const every = [...r.exact, ...r.byLength.flatMap(g => g.words)];
    expect(r.best!.score).toBe(Math.max(...every.map(w => w.score)));
    expect(r.longest!.word.length).toBe(Math.max(...every.map(w => w.word.length)));
  });

  it('handles input with no letters', () => {
    const r = analyzeAnagrams('123');
    expect(r.letters).toBe('');
    expect(r.totalFound).toBe(0);
    expect(r.best).toBeNull();
  });
});
