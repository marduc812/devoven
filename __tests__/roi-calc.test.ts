import {
  calculateRoi,
  formatRoiResult,
  parseRoiInput,
} from '@/Components/Functions/RoiCalcTools/logic';

describe('calculateRoi', () => {
  it('calculates basic ROI', () => {
    const result = calculateRoi({ initialInvestment: 1000, finalValue: 1500, years: null });
    expect(result.profit).toBeCloseTo(500, 2);
    expect(result.roi).toBeCloseTo(50, 2);
    expect(result.isProfit).toBe(true);
  });

  it('calculates loss correctly', () => {
    const result = calculateRoi({ initialInvestment: 1000, finalValue: 800, years: null });
    expect(result.profit).toBeCloseTo(-200, 2);
    expect(result.roi).toBeCloseTo(-20, 2);
    expect(result.isProfit).toBe(false);
  });

  it('calculates annualized ROI when years given', () => {
    // 100% total ROI over 2 years → annualized ≈ 41.42%
    const result = calculateRoi({ initialInvestment: 1000, finalValue: 2000, years: 2 });
    expect(result.annualizedRoi).not.toBeNull();
    expect(result.annualizedRoi!).toBeCloseTo(41.42, 1);
  });

  it('returns null annualized ROI when years not given', () => {
    const result = calculateRoi({ initialInvestment: 1000, finalValue: 1500, years: null });
    expect(result.annualizedRoi).toBeNull();
  });

  it('break-even equals initial investment', () => {
    const result = calculateRoi({ initialInvestment: 2500, finalValue: 3000, years: null });
    expect(result.breakEvenValue).toBe(2500);
  });

  it('throws for non-positive investment', () => {
    expect(() =>
      calculateRoi({ initialInvestment: 0, finalValue: 100, years: null })
    ).toThrow();
  });
});

describe('parseRoiInput', () => {
  it('parses two-line input', () => {
    const result = parseRoiInput('1000\n1500');
    expect(result.initialInvestment).toBe(1000);
    expect(result.finalValue).toBe(1500);
    expect(result.years).toBeNull();
  });

  it('parses three-line input with years', () => {
    const result = parseRoiInput('1000\n1500\n3');
    expect(result.years).toBe(3);
  });

  it('throws when fewer than 2 lines', () => {
    expect(() => parseRoiInput('1000')).toThrow();
  });
});

describe('formatRoiResult', () => {
  it('includes key sections', () => {
    const output = formatRoiResult({ initialInvestment: 1000, finalValue: 1500, years: 2 });
    expect(output).toContain('ROI Summary');
    expect(output).toContain('Break-even Analysis');
    expect(output).toContain('Annualized ROI');
  });
});
