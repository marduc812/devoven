import { shannonEntropy, calculateTextEntropy } from '@/Components/Functions/TextEntropyTools/logic';

describe('shannonEntropy', () => {
  it('empty string → 0', () => expect(shannonEntropy('')).toBe(0));
  it('uniform string → 0', () => expect(shannonEntropy('aaaa')).toBe(0));
  it('"ab" → 1 bit', () => expect(shannonEntropy('ab')).toBeCloseTo(1));
  it('more diverse string has higher entropy', () => {
    expect(shannonEntropy('abcdefghij')).toBeGreaterThan(shannonEntropy('aaabbbccc'));
  });
  it('non-negative for any input', () => expect(shannonEntropy('hello world')).toBeGreaterThan(0));
});

describe('calculateTextEntropy', () => {
  it('throws for empty input', () => expect(() => calculateTextEntropy('')).toThrow());
  it('includes Shannon entropy label', () => expect(calculateTextEntropy('hello')).toContain('Shannon entropy:'));
  it('includes assessment label', () => expect(calculateTextEntropy('hello')).toContain('Assessment:'));
  it('includes benchmark info', () => expect(calculateTextEntropy('hello world')).toContain('English text:'));
  it('shows bar chart for frequent chars', () => expect(calculateTextEntropy('aabbc')).toContain("'a'"));
  it('shows unique char count', () => expect(calculateTextEntropy('abc')).toContain('Unique chars:'));
  it('shows total bits', () => expect(calculateTextEntropy('abc')).toContain('Total bits:'));
});
