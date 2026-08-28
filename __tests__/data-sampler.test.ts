import {
  parseLines,
  shuffleArray,
  sampleArray,
  splitArray,
  deduplicateArray,
  sortArray,
  processSampler,
} from '@/Components/Functions/DataSamplerTools/logic';

describe('parseLines', () => {
  it('splits lines and trims', () => {
    expect(parseLines('a\n b \nc')).toEqual(['a', 'b', 'c']);
  });
  it('filters empty lines', () => {
    expect(parseLines('a\n\nb')).toEqual(['a', 'b']);
  });
});

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });
  it('contains same elements', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });
  it('does not mutate original', () => {
    const arr = ['a', 'b', 'c'];
    const orig = arr.slice();
    shuffleArray(arr);
    expect(arr).toEqual(orig);
  });
});

describe('sampleArray', () => {
  it('returns correct sample size', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const sampled = sampleArray(arr, 5);
    expect(sampled.length).toBe(5);
  });
  it('samples without replacement', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const sampled = sampleArray(arr, 5);
    const unique = new Set(sampled);
    expect(unique.size).toBe(5);
  });
  it('returns all if n >= arr.length', () => {
    const arr = ['a', 'b', 'c'];
    const sampled = sampleArray(arr, 10);
    expect(sampled.length).toBe(3);
  });
});

describe('splitArray', () => {
  it('splits correctly at 80/20', () => {
    const arr = Array.from({ length: 100 }, function(_, i) { return String(i); });
    const { train, test } = splitArray(arr, 0.8);
    expect(train.length).toBe(80);
    expect(test.length).toBe(20);
  });
  it('train + test = original length', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f'];
    const { train, test } = splitArray(arr, 0.7);
    expect(train.length + test.length).toBe(arr.length);
  });
});

describe('deduplicateArray', () => {
  it('removes duplicates', () => {
    const result = deduplicateArray(['a', 'b', 'a', 'c', 'b']);
    expect(result).toEqual(['a', 'b', 'c']);
  });
  it('preserves order of first occurrence', () => {
    const result = deduplicateArray(['c', 'a', 'b', 'a']);
    expect(result).toEqual(['c', 'a', 'b']);
  });
  it('handles empty array', () => {
    expect(deduplicateArray([])).toEqual([]);
  });
});

describe('sortArray', () => {
  it('sorts alphabetically', () => {
    expect(sortArray(['banana', 'apple', 'cherry'], false)).toEqual(['apple', 'banana', 'cherry']);
  });
  it('sorts numerically', () => {
    expect(sortArray(['10', '2', '1', '20'], true)).toEqual(['1', '2', '10', '20']);
  });
});

describe('processSampler', () => {
  const items = 'apple\nbanana\ncherry\ndate\nfig\ngrape\nkiwi\nlemon\nmango\norange';
  it('sample mode works', () => {
    const out = processSampler(items, 'sample', 3, 0.8, false);
    expect(out).toContain('Sample');
    expect(out).toContain('3 of 10');
  });
  it('shuffle mode works', () => {
    const out = processSampler(items, 'shuffle', 5, 0.8, false);
    expect(out).toContain('Shuffled');
  });
  it('split mode works', () => {
    const out = processSampler(items, 'split', 5, 0.8, false);
    expect(out).toContain('Train set');
    expect(out).toContain('Test set');
  });
  it('deduplicate mode works', () => {
    const out = processSampler('a\nb\na\nc', 'deduplicate', 5, 0.8, false);
    expect(out).toContain('Deduplicated');
    expect(out).toContain('1 duplicates removed');
  });
  it('sort mode works', () => {
    const out = processSampler('banana\napple\ncherry', 'sort', 5, 0.8, false);
    expect(out).toContain('apple');
  });
  it('throws for empty input', () => {
    expect(() => processSampler('', 'shuffle', 5, 0.8, false)).toThrow();
  });
  it('throws for invalid sample size', () => {
    expect(() => processSampler(items, 'sample', 0, 0.8, false)).toThrow();
  });
  it('throws for invalid split ratio', () => {
    expect(() => processSampler(items, 'split', 5, 1.0, false)).toThrow();
  });
});
