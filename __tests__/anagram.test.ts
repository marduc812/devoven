import { isAnagram, compareAnagram } from '@/Components/Functions/AnagramTools/logic';
describe('isAnagram', () => {
  it('"listen" and "silent" are anagrams', () => expect(isAnagram('listen', 'silent')).toBe(true));
  it('"hello" and "world" are not anagrams', () => expect(isAnagram('hello', 'world')).toBe(false));
  it('case insensitive', () => expect(isAnagram('Listen', 'Silent')).toBe(true));
  it('ignores spaces', () => expect(isAnagram('astronomer', 'moon starer')).toBe(true));
  it('empty strings are anagrams', () => expect(isAnagram('', '')).toBe(true));
});
// ─── compareAnagram (structured) ──────────────────────────────────────────────

describe('compareAnagram', () => {
  it('reports a true anagram with no mismatches', () => {
    const r = compareAnagram('listen', 'silent');
    expect(r.isAnagram).toBe(true);
    expect(r.mismatchCount).toBe(0);
    expect(r.normalizedA).toBe(r.normalizedB);
    expect(r.letters.every(l => l.diff === 0)).toBe(true);
  });

  it('ignores case, spaces and punctuation', () => {
    const r = compareAnagram('Dormitory', 'Dirty Room!');
    expect(r.isAnagram).toBe(true);
    expect(r.lettersA).toBe(9);
    expect(r.lettersB).toBe(9);
  });

  it('records per-letter surplus with sign', () => {
    const r = compareAnagram('aab', 'abb');
    const a = r.letters.find(l => l.letter === 'a')!;
    const b = r.letters.find(l => l.letter === 'b')!;
    expect(a).toMatchObject({ countA: 2, countB: 1, diff: 1 });
    expect(b).toMatchObject({ countA: 1, countB: 2, diff: -1 });
    expect(r.mismatchCount).toBe(2);
    expect(r.isAnagram).toBe(false);
  });

  it('lists letters alphabetically across both strings', () => {
    const r = compareAnagram('cab', 'xyz');
    expect(r.letters.map(l => l.letter)).toEqual(['a', 'b', 'c', 'x', 'y', 'z']);
  });

  it('handles empty and letterless input', () => {
    const r = compareAnagram('', '');
    expect(r.isAnagram).toBe(true);
    expect(r.letters).toEqual([]);
    expect(r.lettersA).toBe(0);

    const punct = compareAnagram('!!!', '???');
    expect(punct.isAnagram).toBe(true);
    expect(punct.normalizedA).toBe('');
  });

  it('counts different lengths as not an anagram', () => {
    const r = compareAnagram('abc', 'abcd');
    expect(r.isAnagram).toBe(false);
    expect(r.lettersA).toBe(3);
    expect(r.lettersB).toBe(4);
    expect(r.mismatchCount).toBe(1);
  });

  it('agrees with isAnagram', () => {
    for (const [a, b] of [['listen', 'silent'], ['hello', 'world'], ['a', 'a']]) {
      expect(compareAnagram(a, b).isAnagram).toBe(isAnagram(a, b));
    }
  });
});
