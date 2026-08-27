import { calculateTax, formatTaxResult, parseTaxInput } from '@/Components/Functions/TaxCalcTools/logic';

describe('calculateTax - add mode', () => {
  it('adds 20% tax to 100', () => {
    const result = calculateTax({ amount: 100, rate: 20, mode: 'add' });
    expect(result.preTax).toBeCloseTo(100, 2);
    expect(result.taxAmount).toBeCloseTo(20, 2);
    expect(result.postTax).toBeCloseTo(120, 2);
  });

  it('adds 0% tax (no change)', () => {
    const result = calculateTax({ amount: 50, rate: 0, mode: 'add' });
    expect(result.taxAmount).toBeCloseTo(0, 5);
    expect(result.postTax).toBeCloseTo(50, 2);
  });

  it('adds 100% tax', () => {
    const result = calculateTax({ amount: 200, rate: 100, mode: 'add' });
    expect(result.postTax).toBeCloseTo(400, 2);
  });
});

describe('calculateTax - extract mode', () => {
  it('extracts 20% tax from 120 (post-tax inclusive)', () => {
    const result = calculateTax({ amount: 120, rate: 20, mode: 'extract' });
    expect(result.preTax).toBeCloseTo(100, 2);
    expect(result.taxAmount).toBeCloseTo(20, 2);
    expect(result.postTax).toBeCloseTo(120, 2);
  });

  it('extracts 10% tax from 110', () => {
    const result = calculateTax({ amount: 110, rate: 10, mode: 'extract' });
    expect(result.preTax).toBeCloseTo(100, 2);
    expect(result.taxAmount).toBeCloseTo(10, 2);
  });
});

describe('calculateTax - validation', () => {
  it('throws on negative amount', () => {
    expect(() => calculateTax({ amount: -1, rate: 20, mode: 'add' })).toThrow();
  });

  it('throws on negative rate', () => {
    expect(() => calculateTax({ amount: 100, rate: -1, mode: 'add' })).toThrow();
  });

  it('throws on rate > 100', () => {
    expect(() => calculateTax({ amount: 100, rate: 101, mode: 'add' })).toThrow();
  });
});

describe('parseTaxInput', () => {
  it('parses valid input', () => {
    const result = parseTaxInput('100\n20', 'add');
    expect(result.amount).toBe(100);
    expect(result.rate).toBe(20);
    expect(result.mode).toBe('add');
  });

  it('throws when fewer than 2 lines', () => {
    expect(() => parseTaxInput('100', 'add')).toThrow();
  });

  it('throws for non-numeric values', () => {
    expect(() => parseTaxInput('abc\ndef', 'add')).toThrow();
  });
});

describe('formatTaxResult', () => {
  it('includes pre-tax, tax amount, and post-tax in output', () => {
    const output = formatTaxResult({ amount: 100, rate: 21, mode: 'add' });
    expect(output).toContain('Pre-tax amount');
    expect(output).toContain('Tax amount');
    expect(output).toContain('Post-tax total');
    expect(output).toContain('Common Tax Rate Reference');
  });

  it('includes reference rates in output', () => {
    const output = formatTaxResult({ amount: 100, rate: 20, mode: 'add' });
    expect(output).toContain('UK VAT');
    expect(output).toContain('Germany VAT');
  });
});
