import {
  calculateDcf,
  calculateNpv,
  calculateIrr,
  formatDcfResult,
  parseDcfInput,
} from '@/Components/Functions/DcfCalcTools/logic';

describe('calculateNpv', () => {
  it('computes NPV at 0% rate', () => {
    // Sum of cash flows with no discounting
    const npv = calculateNpv([-100, 50, 60], 0);
    expect(npv).toBeCloseTo(10, 4);
  });

  it('computes NPV with positive rate', () => {
    // -100 + 50/1.1 + 60/1.21 ≈ -100 + 45.45 + 49.59 ≈ -4.96
    const npv = calculateNpv([-100, 50, 60], 0.1);
    expect(npv).toBeCloseTo(-4.96, 1);
  });
});

describe('calculateIrr', () => {
  it('finds IRR for simple investment', () => {
    // -100, 110 → IRR = 10%
    const irr = calculateIrr([-100, 110]);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(0.1, 4);
  });

  it('returns null when no real IRR in range', () => {
    // All positive cash flows — IRR does not converge
    const irr = calculateIrr([100, 100, 100]);
    expect(irr).toBeNull();
  });
});

describe('calculateDcf', () => {
  it('throws when no cash flows', () => {
    expect(() => calculateDcf({ discountRate: 10, cashFlows: [] })).toThrow();
  });

  it('marks investment as worthwhile when NPV > 0', () => {
    // -100 + 120/(1.05) ≈ 14.3 > 0
    const result = calculateDcf({ discountRate: 5, cashFlows: [-100, 120] });
    expect(result.isWorthwhile).toBe(true);
    expect(result.npv).toBeGreaterThan(0);
  });

  it('marks investment as not worthwhile when NPV < 0', () => {
    const result = calculateDcf({ discountRate: 20, cashFlows: [-100, 110] });
    expect(result.isWorthwhile).toBe(false);
  });

  it('returns rows with correct PV for year 0', () => {
    const result = calculateDcf({ discountRate: 10, cashFlows: [-1000, 500, 600] });
    expect(result.rows[0].presentValue).toBeCloseTo(-1000, 4);
    expect(result.rows[1].presentValue).toBeCloseTo(500 / 1.1, 2);
  });
});

describe('parseDcfInput', () => {
  it('parses discount rate and cash flows', () => {
    const result = parseDcfInput('10\n-1000\n500\n600');
    expect(result.discountRate).toBe(10);
    expect(result.cashFlows).toEqual([-1000, 500, 600]);
  });

  it('throws when fewer than 2 lines', () => {
    expect(() => parseDcfInput('10')).toThrow();
  });

  it('throws for non-numeric cash flow', () => {
    expect(() => parseDcfInput('10\n-1000\nabc')).toThrow();
  });
});

describe('formatDcfResult', () => {
  it('includes NPV, IRR, and verdict', () => {
    const output = formatDcfResult({ discountRate: 10, cashFlows: [-100, 60, 60] });
    expect(output).toContain('Net Present Value');
    expect(output).toContain('Internal Rate of Return');
    expect(output).toContain('Verdict');
  });
});
