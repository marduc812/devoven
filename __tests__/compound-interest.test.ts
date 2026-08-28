import {
  calculateCompoundInterest,
  formatCompoundResult,
  parseCompoundInput,
} from '@/Components/Functions/CompoundInterestTools/logic';

describe('calculateCompoundInterest', () => {
  it('calculates annual compounding correctly', () => {
    // A = 1000 * (1 + 0.05/1)^(1*1) = 1050
    const result = calculateCompoundInterest({
      principal: 1000,
      annualRate: 5,
      frequency: 'annual',
      years: 1,
    });
    expect(result.finalAmount).toBeCloseTo(1050, 2);
    expect(result.totalInterest).toBeCloseTo(50, 2);
  });

  it('calculates monthly compounding', () => {
    // A = 1000 * (1 + 0.05/12)^(12*1) ≈ 1051.16
    const result = calculateCompoundInterest({
      principal: 1000,
      annualRate: 5,
      frequency: 'monthly',
      years: 1,
    });
    expect(result.finalAmount).toBeCloseTo(1051.16, 1);
  });

  it('computes effective annual rate for monthly compounding', () => {
    // EAR = (1 + 0.05/12)^12 - 1 ≈ 5.116%
    const result = calculateCompoundInterest({
      principal: 1000,
      annualRate: 5,
      frequency: 'monthly',
      years: 1,
    });
    expect(result.effectiveAnnualRate).toBeCloseTo(5.116, 2);
  });

  it('builds year-by-year table up to 30 years', () => {
    const result = calculateCompoundInterest({
      principal: 1000,
      annualRate: 5,
      frequency: 'annual',
      years: 40,
    });
    expect(result.yearByYear.length).toBe(30);
  });

  it('throws for non-positive principal', () => {
    expect(() =>
      calculateCompoundInterest({ principal: 0, annualRate: 5, frequency: 'annual', years: 1 })
    ).toThrow();
  });

  it('throws for negative rate', () => {
    expect(() =>
      calculateCompoundInterest({ principal: 1000, annualRate: -1, frequency: 'annual', years: 1 })
    ).toThrow();
  });

  it('throws for years > 100', () => {
    expect(() =>
      calculateCompoundInterest({ principal: 1000, annualRate: 5, frequency: 'annual', years: 101 })
    ).toThrow();
  });
});

describe('parseCompoundInput', () => {
  it('parses valid input', () => {
    const result = parseCompoundInput('1000\n5\nmonthly\n10');
    expect(result.principal).toBe(1000);
    expect(result.annualRate).toBe(5);
    expect(result.frequency).toBe('monthly');
    expect(result.years).toBe(10);
  });

  it('parses "semi-annual" frequency', () => {
    const result = parseCompoundInput('5000\n4\nsemi-annual\n5');
    expect(result.frequency).toBe('semi-annual');
  });

  it('throws when fewer than 4 lines', () => {
    expect(() => parseCompoundInput('1000\n5\nmonthly')).toThrow();
  });

  it('throws for unknown frequency', () => {
    expect(() => parseCompoundInput('1000\n5\nweekly\n10')).toThrow();
  });
});

describe('formatCompoundResult', () => {
  it('includes final amount and total interest', () => {
    const output = formatCompoundResult({
      principal: 1000,
      annualRate: 5,
      frequency: 'annual',
      years: 5,
    });
    expect(output).toContain('Final Amount');
    expect(output).toContain('Total Interest Earned');
    expect(output).toContain('Effective Annual Rate');
    expect(output).toContain('Year-by-Year Growth');
  });
});
