import { parsePercentageQuery } from '@/Components/Functions/PercentageTools/logic';

describe('parsePercentageQuery', () => {
  it('calculates X% of Y', () => expect(parsePercentageQuery('25% of 200')).toBe('25% of 200 = 50'));
  it('calculates what percent', () => expect(parsePercentageQuery('50 is what % of 200')).toBe('50 is 25% of 200'));
  it('calculates increase', () => expect(parsePercentageQuery('100 increased by 50%')).toBe('100 increased by 50% = 150'));
  it('calculates decrease', () => expect(parsePercentageQuery('200 decreased by 25%')).toBe('200 decreased by 25% = 150'));
  it('handles decimals', () => {
    const r = parsePercentageQuery('12.5% of 80');
    expect(r).toBe('12.5% of 80 = 10');
  });
  it('throws for divide by zero', () => expect(() => parsePercentageQuery('5 is what % of 0')).toThrow());
  it('throws for unknown format', () => expect(() => parsePercentageQuery('gibberish')).toThrow());
  it('calculates percent change', () => {
    const r = parsePercentageQuery('% change from 50 to 75');
    expect(r).toContain('50%');
    expect(r).toContain('increase');
  });
});
