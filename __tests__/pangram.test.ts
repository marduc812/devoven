import { isPangram, getMissingLetters, getLetterFrequency, isIsogram, findShortestPangram, analyzePangram, analyzePangramResult, splitSentences } from '@/Components/Functions/PangramTools/logic';

describe('isPangram', () => {
  it('returns true for classic pangram', () => {
    expect(isPangram('The quick brown fox jumps over the lazy dog')).toBe(true);
  });
  it('returns false for incomplete text', () => {
    expect(isPangram('hello world')).toBe(false);
  });
  it('case insensitive', () => {
    expect(isPangram('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG')).toBe(true);
  });
});

describe('getMissingLetters', () => {
  it('returns empty array for pangram', () => {
    expect(getMissingLetters('The quick brown fox jumps over the lazy dog')).toEqual([]);
  });
  it('returns missing letters for incomplete text', () => {
    const missing = getMissingLetters('hello world');
    expect(missing).toContain('a');
    expect(missing).toContain('z');
    expect(missing).not.toContain('h');
  });
});

describe('getLetterFrequency', () => {
  it('counts letter occurrences', () => {
    const freq = getLetterFrequency('aab');
    expect(freq['a']).toBe(2);
    expect(freq['b']).toBe(1);
    expect(freq['c']).toBe(0);
  });
  it('is case insensitive', () => {
    const freq = getLetterFrequency('Aa');
    expect(freq['a']).toBe(2);
  });
});

describe('isIsogram', () => {
  it('returns true for isogram', () => {
    expect(isIsogram('dermatoglyphics')).toBe(true);
  });
  it('returns false for non-isogram', () => {
    expect(isIsogram('hello')).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isIsogram('')).toBe(false);
  });
});

describe('findShortestPangram', () => {
  it('finds pangram sentence', () => {
    const text = 'Hello world. The quick brown fox jumps over the lazy dog. Another sentence.';
    expect(findShortestPangram(text)).toBe('The quick brown fox jumps over the lazy dog');
  });
  it('returns empty string if no pangram sentence', () => {
    expect(findShortestPangram('hello world')).toBe('');
  });
});

describe('analyzePangram', () => {
  it('reports pangram correctly', () => {
    const result = analyzePangram('The quick brown fox jumps over the lazy dog');
    expect(result).toContain('Yes ✓');
    expect(result).toContain('All 26 letters');
  });
  it('reports missing letters', () => {
    const result = analyzePangram('hello world');
    expect(result).toContain('Missing letters');
  });
  it('throws on empty input', () => {
    expect(() => analyzePangram('')).toThrow();
  });
});

describe('splitSentences', () => {
  it('splits on terminators and drops empties', () => {
    expect(splitSentences('One. Two! Three?  ')).toEqual(['One', 'Two', 'Three']);
  });
  it('returns an empty array for blank input', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});

describe('analyzePangramResult', () => {
  it('reports a classic pangram', () => {
    const r = analyzePangramResult('The quick brown fox jumps over the lazy dog');
    expect(r.isPangram).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.uniqueLetters).toBe(26);
    expect(r.coverage).toBe(1);
    expect(r.isPerfectPangram).toBe(false);
    expect(r.excessLetters).toBe(r.letterCount - 26);
  });

  it('flags a perfect pangram', () => {
    const r = analyzePangramResult('Mr Jock, TV quiz PhD, bags few lynx');
    expect(r.isPangram).toBe(true);
    expect(r.isPerfectPangram).toBe(true);
    expect(r.letterCount).toBe(26);
    expect(r.excessLetters).toBe(0);
    expect(r.onceOnly).toHaveLength(26);
  });

  it('lists missing letters and present letters as complements', () => {
    const r = analyzePangramResult('hello world');
    expect(r.isPangram).toBe(false);
    expect(r.present).toEqual(['d', 'e', 'h', 'l', 'o', 'r', 'w']);
    expect(r.missing).toHaveLength(19);
    expect(r.present.length + r.missing.length).toBe(26);
  });

  it('counts only a–z letters, but all characters', () => {
    const r = analyzePangramResult('ab 12!');
    expect(r.letterCount).toBe(2);
    expect(r.charCount).toBe(6);
    expect(r.wordCount).toBe(2);
  });

  it('picks the most common letter and single-use letters', () => {
    const r = analyzePangramResult('aaab c');
    expect(r.mostCommon).toEqual({ letter: 'a', count: 3 });
    expect(r.onceOnly).toEqual(['b', 'c']);
  });

  it('reports each sentence separately', () => {
    const r = analyzePangramResult('Hello world. The quick brown fox jumps over the lazy dog.');
    expect(r.sentences).toHaveLength(2);
    expect(r.sentences[0].isPangram).toBe(false);
    expect(r.sentences[1].isPangram).toBe(true);
    expect(r.sentences[1].missing).toEqual([]);
    expect(r.shortestPangram).toBe('The quick brown fox jumps over the lazy dog');
  });

  it('returns a zeroed result for empty input instead of throwing', () => {
    const r = analyzePangramResult('');
    expect(r.isPangram).toBe(false);
    expect(r.isIsogram).toBe(false);
    expect(r.uniqueLetters).toBe(0);
    expect(r.coverage).toBe(0);
    expect(r.wordCount).toBe(0);
    expect(r.mostCommon).toBeNull();
    expect(r.sentences).toEqual([]);
  });
});
