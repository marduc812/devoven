export interface RoiInputs {
  initialInvestment: number;
  finalValue: number;
  years: number | null;
}

export interface RoiResult {
  profit: number;
  roi: number;
  annualizedRoi: number | null;
  breakEvenValue: number;
  isProfit: boolean;
}

export function calculateRoi(inputs: RoiInputs): RoiResult {
  const { initialInvestment, finalValue, years } = inputs;
  if (initialInvestment <= 0) throw new Error('Initial investment must be positive');

  const profit = finalValue - initialInvestment;
  const roi = (profit / initialInvestment) * 100;
  const isProfit = profit >= 0;

  let annualizedRoi: number | null = null;
  if (years !== null && years > 0) {
    annualizedRoi = (Math.pow(1 + roi / 100, 1 / years) - 1) * 100;
  }

  const breakEvenValue = initialInvestment;

  return { profit, roi, annualizedRoi, breakEvenValue, isProfit };
}

export interface ProjectionRow {
  year: number;
  value: number;
  gain: number;
}

/**
 * Compound the initial investment forward at the annualized rate, so the final
 * year lands back on the actual final value.
 */
export function roiProjection(inputs: RoiInputs, annualizedRoi: number, maxYears = 10): ProjectionRow[] {
  if (inputs.years === null || inputs.years <= 0) return [];
  const years = Math.min(Math.floor(inputs.years), maxYears);
  const rows: ProjectionRow[] = [{ year: 0, value: inputs.initialInvestment, gain: 0 }];
  for (let y = 1; y <= years; y++) {
    const value = inputs.initialInvestment * Math.pow(1 + annualizedRoi / 100, y);
    rows.push({ year: y, value, gain: value - inputs.initialInvestment });
  }
  return rows;
}

export function formatRoiResult(inputs: RoiInputs): string {
  const result = calculateRoi(inputs);
  const fmt = (n: number) => n.toFixed(2);
  const sign = (n: number) => (n >= 0 ? '+' : '');

  const lines: string[] = [
    '=== ROI Summary ===',
    `Initial Investment: $${fmt(inputs.initialInvestment)}`,
    `Final Value:        $${fmt(inputs.finalValue)}`,
    '',
    `Profit / Loss:      ${sign(result.profit)}$${fmt(result.profit)}`,
    `ROI:                ${sign(result.roi)}${fmt(result.roi)}%`,
    `Outcome:            ${result.isProfit ? 'Gain' : 'Loss'}`,
  ];

  if (result.annualizedRoi !== null && inputs.years !== null) {
    lines.push(`Time Period:        ${inputs.years} year(s)`);
    lines.push(`Annualized ROI:     ${sign(result.annualizedRoi)}${fmt(result.annualizedRoi)}%`);
  }

  lines.push('');
  lines.push('=== Break-even Analysis ===');
  lines.push(`Break-even Value:   $${fmt(result.breakEvenValue)}`);

  const gap = inputs.finalValue - result.breakEvenValue;
  if (gap >= 0) {
    lines.push(`Above Break-even:   +$${fmt(gap)}`);
  } else {
    lines.push(`Below Break-even:   -$${fmt(Math.abs(gap))} (need $${fmt(result.breakEvenValue - inputs.finalValue)} more to break even)`);
  }

  if (result.annualizedRoi !== null && inputs.years !== null && inputs.years > 0) {
    lines.push('');
    lines.push('=== Projected Growth ===');
    lines.push('Year | Projected Value');
    lines.push('-----+----------------');
    for (let y = 1; y <= Math.min(inputs.years, 10); y++) {
      const projected = inputs.initialInvestment * Math.pow(1 + result.annualizedRoi / 100, y);
      lines.push(`${String(y).padStart(4)} | $${fmt(projected)}`);
    }
  }

  return lines.join('\n');
}

export function parseRoiInput(input: string): RoiInputs {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) {
    throw new Error('Enter initial investment, final value, and optionally years — one per line');
  }

  const initialInvestment = parseFloat(lines[0].replace(/[^0-9.]/g, ''));
  const finalValue = parseFloat(lines[1].replace(/[^0-9.]/g, ''));
  let years: number | null = null;

  if (lines.length >= 3) {
    const y = parseFloat(lines[2].replace(/[^0-9.]/g, ''));
    if (!isNaN(y) && y > 0) years = y;
  }

  if (isNaN(initialInvestment) || isNaN(finalValue)) {
    throw new Error('Initial investment and final value must be valid numbers');
  }

  return { initialInvestment, finalValue, years };
}
