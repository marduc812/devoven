import { fibonacci, formatFibonacci } from '@/Components/Functions/FibonacciTools/logic';
describe('fibonacci', () => {
  it('first 10 fibonacci numbers', () => {
    const seq = fibonacci(10).map(n => Number(n));
    expect(seq).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
  });
  it('returns n terms', () => expect(fibonacci(5)).toHaveLength(5));
  it('handles n=1', () => expect(fibonacci(1)).toEqual(['0']));
  it('throws for n=0', () => expect(() => fibonacci(0)).toThrow());
  it('throws for n > 1000', () => expect(() => fibonacci(1001)).toThrow());
  it('handles large numbers with string precision', () => {
    const seq = fibonacci(50);
    // F(49) = 12586269025 — over 10 billion
    expect(seq[49].length).toBeGreaterThan(9);
  });
});
describe('formatFibonacci', () => {
  it('includes first 5 terms', () => {
    const r = formatFibonacci('5');
    expect(r).toContain('F(   0)');
    expect(r).toContain('F(   4)');
  });
  it('shows digit count of last term', () => expect(formatFibonacci('10')).toContain('digits'));
  it('throws for non-number input', () => expect(() => formatFibonacci('abc')).toThrow());
});
