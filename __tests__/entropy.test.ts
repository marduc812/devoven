import { shannonEntropy, calculateEntropy } from '@/Components/Functions/EntropyTools/logic';
describe('shannonEntropy', () => {
  it('entropy of empty string is 0', () => expect(shannonEntropy('')).toBe(0));
  it('entropy of uniform string is 0', () => expect(shannonEntropy('aaaa')).toBe(0));
  it('entropy of "ab" is 1', () => expect(shannonEntropy('ab')).toBeCloseTo(1));
  it('entropy of longer diverse string is higher', () => {
    expect(shannonEntropy('abcdefghijklmnop')).toBeGreaterThan(shannonEntropy('aaabbbccc'));
  });
  it('entropy is non-negative', () => expect(shannonEntropy('hello world')).toBeGreaterThan(0));
});
describe('calculateEntropy', () => {
  it('includes Shannon entropy label', () => expect(calculateEntropy('hello')).toContain('Shannon entropy:'));
  it('includes assessment', () => expect(calculateEntropy('hello')).toContain('Assessment:'));
  it('shows top characters', () => expect(calculateEntropy('aabbc')).toContain("'a'"));
  it('throws for empty string', () => expect(() => calculateEntropy('')).toThrow());
});
