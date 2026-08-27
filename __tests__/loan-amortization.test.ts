import {
  calculateLoanAmortization,
  formatAmortResult,
  parseLoanAmortInput,
} from '@/Components/Functions/LoanAmortizationTools/logic';

describe('calculateLoanAmortization', () => {
  it('calculates monthly payment correctly for standard loan', () => {
    // $100,000 at 6% for 30 years → ~$599.55/mo
    const result = calculateLoanAmortization({
      loanAmount: 100000,
      annualRate: 6,
      term: 30,
      termUnit: 'years',
    });
    expect(result.monthlyPayment).toBeCloseTo(599.55, 0);
  });

  it('calculates total months from years correctly', () => {
    const result = calculateLoanAmortization({
      loanAmount: 10000,
      annualRate: 5,
      term: 5,
      termUnit: 'years',
    });
    expect(result.totalMonths).toBe(60);
  });

  it('accepts term in months', () => {
    const result = calculateLoanAmortization({
      loanAmount: 10000,
      annualRate: 5,
      term: 24,
      termUnit: 'months',
    });
    expect(result.totalMonths).toBe(24);
  });

  it('returns 0% rate loan with simple division', () => {
    const result = calculateLoanAmortization({
      loanAmount: 12000,
      annualRate: 0,
      term: 12,
      termUnit: 'months',
    });
    expect(result.monthlyPayment).toBeCloseTo(1000, 2);
    expect(result.totalInterest).toBeCloseTo(0, 2);
  });

  it('builds schedule for first 12 months when term > 12', () => {
    const result = calculateLoanAmortization({
      loanAmount: 50000,
      annualRate: 4,
      term: 5,
      termUnit: 'years',
    });
    expect(result.schedule.length).toBe(12);
  });

  it('builds full schedule when term <= 12 months', () => {
    const result = calculateLoanAmortization({
      loanAmount: 6000,
      annualRate: 5,
      term: 6,
      termUnit: 'months',
    });
    expect(result.schedule.length).toBe(6);
  });

  it('balance approaches 0 at last scheduled month for 6-month loan', () => {
    const result = calculateLoanAmortization({
      loanAmount: 6000,
      annualRate: 5,
      term: 6,
      termUnit: 'months',
    });
    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.balance).toBeCloseTo(0, 0);
  });

  it('each schedule row: principal + interest ≈ monthly payment', () => {
    const result = calculateLoanAmortization({
      loanAmount: 20000,
      annualRate: 7,
      term: 3,
      termUnit: 'years',
    });
    for (const row of result.schedule) {
      expect(row.principal + row.interest).toBeCloseTo(result.monthlyPayment, 2);
    }
  });

  it('throws for non-positive loan amount', () => {
    expect(() =>
      calculateLoanAmortization({ loanAmount: 0, annualRate: 5, term: 5, termUnit: 'years' })
    ).toThrow();
  });

  it('throws for negative rate', () => {
    expect(() =>
      calculateLoanAmortization({ loanAmount: 10000, annualRate: -1, term: 5, termUnit: 'years' })
    ).toThrow();
  });

  it('throws for term > 50 years (600 months)', () => {
    expect(() =>
      calculateLoanAmortization({ loanAmount: 10000, annualRate: 5, term: 51, termUnit: 'years' })
    ).toThrow();
  });

  it('computes principalPct + interestPct ≈ 100', () => {
    const result = calculateLoanAmortization({
      loanAmount: 50000,
      annualRate: 5,
      term: 15,
      termUnit: 'years',
    });
    expect(result.principalPct + result.interestPct).toBeCloseTo(100, 5);
  });
});

describe('parseLoanAmortInput', () => {
  it('parses valid 3-line input', () => {
    const result = parseLoanAmortInput('100000\n6\n30', 'years');
    expect(result.loanAmount).toBe(100000);
    expect(result.annualRate).toBe(6);
    expect(result.term).toBe(30);
    expect(result.termUnit).toBe('years');
  });

  it('throws for fewer than 3 lines', () => {
    expect(() => parseLoanAmortInput('100000\n6', 'years')).toThrow();
  });

  it('throws for non-numeric values', () => {
    expect(() => parseLoanAmortInput('abc\ndef\nghi', 'years')).toThrow();
  });
});

describe('formatAmortResult', () => {
  it('includes summary and schedule sections', () => {
    const output = formatAmortResult({
      loanAmount: 100000,
      annualRate: 5,
      term: 30,
      termUnit: 'years',
    });
    expect(output).toContain('Loan Amortization Summary');
    expect(output).toContain('Monthly Payment');
    expect(output).toContain('Principal vs Interest Breakdown');
    expect(output).toContain('Amortization Schedule');
  });
});
