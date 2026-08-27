import { countWordFrequency, formatWordFrequency } from '@/Components/Functions/WordFrequencyTools/logic';

describe('countWordFrequency', () => {
  it('counts words correctly', () => {
    const r = countWordFrequency('the cat sat on the mat the cat');
    expect(r.total).toBeGreaterThan(0);
  });
  it('counts unique words', () => {
    const r = countWordFrequency('hello world hello');
    expect(r.unique).toBe(2);
  });
  it('top word has highest count', () => {
    const r = countWordFrequency('a a a b b c');
    // "a", "b", "c" are 1 char — filtered by {2,} pattern
    expect(r.total).toBe(0);
  });
  it('finds most frequent word', () => {
    const r = countWordFrequency('the quick brown fox the quick the');
    expect(r.topWords[0].word).toBe('the');
    expect(r.topWords[0].count).toBe(3);
  });
  it('handles empty string', () => {
    const r = countWordFrequency('');
    expect(r.total).toBe(0);
    expect(r.unique).toBe(0);
  });
  it('includes percent in results', () => {
    const r = countWordFrequency('hello hello world');
    const helloEntry = r.topWords.find(w => w.word === 'hello');
    expect(helloEntry).toBeDefined();
    expect(parseFloat(helloEntry!.percent)).toBeCloseTo(66.7, 0);
  });
});

describe('formatWordFrequency', () => {
  it('returns no words message for empty input', () => {
    expect(formatWordFrequency({ total: 0, unique: 0, topWords: [] })).toBe('No words found.');
  });
  it('includes total words', () => {
    const r = countWordFrequency('hello world hello');
    expect(formatWordFrequency(r)).toContain('Total words:');
  });
  it('includes unique count', () => {
    const r = countWordFrequency('hello world hello');
    expect(formatWordFrequency(r)).toContain('Unique words:');
  });
});
