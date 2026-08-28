import {
  calculateLoan,
  parseLoanInput,
  formatLoanResult,
  fullAmortization,
  yearlyAmortization,
} from '@/Components/Functions/LoanCalcTools/logic';

describe('calculateLoan', () => {
  it('calculates monthly payment correctly', () => {
    // 200000 at 5% for 30 years
    const result = calculateLoan({ principal: 200000, annualRate: 5, termYears: 30 });
    expect(result.monthlyPayment).toBeCloseTo(1073.64, 1);
  });

  it('calculates zero interest loan', () => {
    const result = calculateLoan({ principal: 12000, annualRate: 0, termYears: 1 });
    expect(result.monthlyPayment).toBeCloseTo(1000, 1);
    expect(result.totalInterest).toBeCloseTo(0, 1);
  });

  it('returns 12 amortization rows', () => {
    const result = calculateLoan({ principal: 100000, annualRate: 6, termYears: 30 });
    expect(result.amortization.length).toBe(12);
  });

  it('first month interest is correct', () => {
    const result = calculateLoan({ principal: 100000, annualRate: 6, termYears: 30 });
    // 100000 * 0.06 / 12 = 500
    expect(result.amortization[0].interest).toBeCloseTo(500, 1);
  });

  it('throws on non-positive principal', () => {
    expect(() => calculateLoan({ principal: 0, annualRate: 5, termYears: 30 })).toThrow();
  });

  it('throws on negative rate', () => {
    expect(() => calculateLoan({ principal: 100000, annualRate: -1, termYears: 30 })).toThrow();
  });

  it('total payment minus principal equals total interest', () => {
    const result = calculateLoan({ principal: 150000, annualRate: 4.5, termYears: 15 });
    expect(result.totalPayment - 150000).toBeCloseTo(result.totalInterest, 0);
  });
});

describe('parseLoanInput', () => {
  it('parses three-line input', () => {
    const result = parseLoanInput('200000\n5\n30');
    expect(result.principal).toBe(200000);
    expect(result.annualRate).toBe(5);
    expect(result.termYears).toBe(30);
  });

  it('throws with fewer than 3 lines', () => {
    expect(() => parseLoanInput('200000\n5')).toThrow();
  });
});

describe('formatLoanResult', () => {
  it('includes monthly payment in output', () => {
    const output = formatLoanResult({ principal: 200000, annualRate: 5, termYears: 30 });
    expect(output).toContain('Monthly Payment');
    expect(output).toContain('Total Interest');
  });

  it('includes amortization table header', () => {
    const output = formatLoanResult({ principal: 100000, annualRate: 6, termYears: 30 });
    expect(output).toContain('Amortization');
  });
});

describe('fullAmortization', () => {
  const inputs = { principal: 200000, annualRate: 5, termYears: 30 };

  it('returns one row per month of the term', () => {
    expect(fullAmortization(inputs)).toHaveLength(360);
  });

  it('pays the balance down to exactly zero', () => {
    const rows = fullAmortization(inputs);
    expect(rows[rows.length - 1].balance).toBe(0);
  });

  it('repays the principal exactly once across the schedule', () => {
    const repaid = fullAmortization(inputs).reduce((sum, row) => sum + row.principal, 0);
    expect(repaid).toBeCloseTo(inputs.principal, 6);
  });

  it('shifts from mostly interest to mostly principal', () => {
    const rows = fullAmortization(inputs);
    expect(rows[0].interest).toBeGreaterThan(rows[0].principal);
    expect(rows[359].principal).toBeGreaterThan(rows[359].interest);
  });

  it('charges no interest on a zero-rate loan', () => {
    const rows = fullAmortization({ principal: 12000, annualRate: 0, termYears: 1 });
    expect(rows).toHaveLength(12);
    expect(rows.every((row) => row.interest === 0)).toBe(true);
    expect(rows[11].balance).toBe(0);
  });
});

describe('yearlyAmortization', () => {
  const inputs = { principal: 200000, annualRate: 5, termYears: 30 };

  it('returns one row per year', () => {
    expect(yearlyAmortization(inputs)).toHaveLength(30);
  });

  it('each year totals twelve monthly payments', () => {
    const { monthlyPayment } = calculateLoan(inputs);
    expect(yearlyAmortization(inputs)[0].payment).toBeCloseTo(monthlyPayment * 12, 4);
  });

  it('carries the closing balance of the last month of each year', () => {
    const months = fullAmortization(inputs);
    const years = yearlyAmortization(inputs);
    expect(years[0].balance).toBe(months[11].balance);
    expect(years[29].balance).toBe(0);
  });
});
