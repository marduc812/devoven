export interface DcfInputs {
  discountRate: number;
  cashFlows: number[];
}

export interface CashFlowRow {
  year: number;
  cashFlow: number;
  presentValue: number;
}

export interface DcfResult {
  npv: number;
  irr: number | null;
  rows: CashFlowRow[];
  isWorthwhile: boolean;
}

export function calculateNpv(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
}

export function calculateIrr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;

  // Bisection method
  let lo = -0.9999;
  let hi = 10.0;
  const maxIter = 1000;
  const tol = 1e-8;

  const npvAt = (r: number) => calculateNpv(cashFlows, r);

  const npvLo = npvAt(lo);
  const npvHi = npvAt(hi);

  // No sign change — IRR may not exist in range
  if (npvLo * npvHi > 0) return null;

  let mid = 0;
  for (let i = 0; i < maxIter; i++) {
    mid = (lo + hi) / 2;
    const npvMid = npvAt(mid);
    if (Math.abs(npvMid) < tol || (hi - lo) / 2 < tol) break;
    if (npvLo * npvMid < 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return mid;
}

export function calculateDcf(inputs: DcfInputs): DcfResult {
  const { discountRate, cashFlows } = inputs;
  if (cashFlows.length === 0) throw new Error('At least one cash flow is required');
  if (discountRate < -100) throw new Error('Discount rate must be >= -100%');

  const r = discountRate / 100;
  const rows: CashFlowRow[] = cashFlows.map((cf, i) => ({
    year: i,
    cashFlow: cf,
    presentValue: cf / Math.pow(1 + r, i),
  }));

  const npv = rows.reduce((sum, row) => sum + row.presentValue, 0);
  const irr = calculateIrr(cashFlows);
  const isWorthwhile = npv > 0;

  return { npv, irr, rows, isWorthwhile };
}

/**
 * First year at which the running sum of discounted cash flows turns positive,
 * with the fractional part interpolated inside that year. Null if it never does.
 */
export function discountedPayback(rows: CashFlowRow[]): number | null {
  let cumulative = 0;
  for (const row of rows) {
    const previous = cumulative;
    cumulative += row.presentValue;
    if (previous < 0 && cumulative >= 0) {
      return row.year - 1 + previous / (previous - cumulative);
    }
  }
  return null;
}

export interface SensitivityPoint {
  rate: number;
  npv: number;
}

/** NPV sampled across a range of discount rates, for the sensitivity curve. */
export function npvSensitivity(cashFlows: number[], maxRate = 40, steps = 41): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const rate = (maxRate * i) / (steps - 1);
    points.push({ rate, npv: calculateNpv(cashFlows, rate / 100) });
  }
  return points;
}

export function formatDcfResult(inputs: DcfInputs): string {
  const result = calculateDcf(inputs);
  const fmt = (n: number) => {
    const sign = n < 0 ? '-' : '';
    return `${sign}$${Math.abs(n).toFixed(2)}`;
  };

  const lines: string[] = [
    '=== DCF Analysis ===',
    `Discount Rate: ${inputs.discountRate}%`,
    '',
    'Year | Cash Flow      | Present Value',
    '-----+----------------+---------------',
  ];

  for (const row of result.rows) {
    const yr = String(row.year).padStart(4);
    const cf = fmt(row.cashFlow).padStart(14);
    const pv = fmt(row.presentValue).padStart(13);
    lines.push(`${yr} | ${cf} | ${pv}`);
  }

  lines.push('');
  lines.push(`Net Present Value (NPV): ${fmt(result.npv)}`);

  if (result.irr !== null) {
    lines.push(`Internal Rate of Return (IRR): ${(result.irr * 100).toFixed(4)}%`);
  } else {
    lines.push('Internal Rate of Return (IRR): N/A (no real IRR found)');
  }

  lines.push('');
  if (result.isWorthwhile) {
    lines.push(`Verdict: Investment is WORTHWHILE at ${inputs.discountRate}% discount rate (NPV > 0)`);
  } else {
    lines.push(`Verdict: Investment is NOT worthwhile at ${inputs.discountRate}% discount rate (NPV <= 0)`);
  }

  return lines.join('\n');
}

export function parseDcfInput(input: string): DcfInputs {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) {
    throw new Error('Enter discount rate (first line) then cash flows one per line (year 0 first, usually negative)');
  }

  const discountRate = parseFloat(lines[0].replace(/[^0-9.\-]/g, ''));
  if (isNaN(discountRate)) throw new Error('First line must be the discount rate (e.g. 10 for 10%)');

  const cashFlows: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Allow negative numbers
    const raw = lines[i].replace(/[^0-9.\-]/g, '');
    const val = parseFloat(raw);
    if (isNaN(val)) throw new Error(`Invalid cash flow on line ${i + 1}: "${lines[i]}"`);
    cashFlows.push(val);
  }

  return { discountRate, cashFlows };
}
