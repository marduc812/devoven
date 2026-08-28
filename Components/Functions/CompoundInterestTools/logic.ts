export type CompoundFrequency = 'daily' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface CompoundInputs {
  principal: number;
  annualRate: number;
  frequency: CompoundFrequency;
  years: number;
}

export interface YearRow {
  year: number;
  balance: number;
  interestEarned: number;
  totalInterest: number;
}

export interface CompoundResult {
  finalAmount: number;
  totalInterest: number;
  effectiveAnnualRate: number;
  yearByYear: YearRow[];
}

const FREQ_MAP: Record<CompoundFrequency, number> = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  'semi-annual': 2,
  annual: 1,
};

export function calculateCompoundInterest(inputs: CompoundInputs): CompoundResult {
  const { principal, annualRate, frequency, years } = inputs;
  if (principal <= 0) throw new Error('Principal must be positive');
  if (annualRate < 0) throw new Error('Rate cannot be negative');
  if (years <= 0 || years > 100) throw new Error('Years must be between 1 and 100');

  const n = FREQ_MAP[frequency];
  const r = annualRate / 100;

  const finalAmount = principal * Math.pow(1 + r / n, n * years);
  const totalInterest = finalAmount - principal;
  const effectiveAnnualRate = (Math.pow(1 + r / n, n) - 1) * 100;

  const yearByYear: YearRow[] = [];
  const maxYears = Math.min(years, 30);
  let cumulativeInterest = 0;

  for (let y = 1; y <= maxYears; y++) {
    const balance = principal * Math.pow(1 + r / n, n * y);
    const prevBalance = principal * Math.pow(1 + r / n, n * (y - 1));
    const interestEarned = balance - prevBalance;
    cumulativeInterest += interestEarned;
    yearByYear.push({ year: y, balance, interestEarned, totalInterest: cumulativeInterest });
  }

  return { finalAmount, totalInterest, effectiveAnnualRate, yearByYear };
}

export function formatCompoundResult(inputs: CompoundInputs): string {
  const result = calculateCompoundInterest(inputs);
  const fmt = (n: number) => n.toFixed(2);
  const pct = (n: number) => n.toFixed(4);

  const lines: string[] = [
    '=== Compound Interest Summary ===',
    `Principal:             $${fmt(inputs.principal)}`,
    `Annual Rate:           ${inputs.annualRate}%`,
    `Compounding:           ${inputs.frequency} (n=${FREQ_MAP[inputs.frequency]}/yr)`,
    `Time:                  ${inputs.years} year(s)`,
    '',
    `Final Amount:          $${fmt(result.finalAmount)}`,
    `Total Interest Earned: $${fmt(result.totalInterest)}`,
    `Effective Annual Rate: ${pct(result.effectiveAnnualRate)}%`,
    '',
    '=== Year-by-Year Growth ===',
    'Year | Balance         | Interest (yr)   | Total Interest',
    '-----+-----------------+-----------------+----------------',
  ];

  for (const row of result.yearByYear) {
    const yr = String(row.year).padStart(4);
    const bal = ('$' + fmt(row.balance)).padStart(15);
    const int = ('$' + fmt(row.interestEarned)).padStart(15);
    const tot = ('$' + fmt(row.totalInterest)).padStart(14);
    lines.push(`${yr} | ${bal} | ${int} | ${tot}`);
  }

  return lines.join('\n');
}

export function parseCompoundInput(input: string): CompoundInputs {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 4) {
    throw new Error('Enter principal, annual rate (%), compounding frequency, and years — one per line');
  }

  const principal = parseFloat(lines[0].replace(/[^0-9.]/g, ''));
  const annualRate = parseFloat(lines[1].replace(/[^0-9.]/g, ''));
  const freqRaw = lines[2].toLowerCase().trim();
  const years = parseFloat(lines[3].replace(/[^0-9.]/g, ''));

  if (isNaN(principal) || isNaN(annualRate) || isNaN(years)) {
    throw new Error('Principal, rate, and years must be valid numbers');
  }

  const freqMap: Record<string, CompoundFrequency> = {
    daily: 'daily', '365': 'daily',
    monthly: 'monthly', '12': 'monthly',
    quarterly: 'quarterly', '4': 'quarterly',
    'semi-annual': 'semi-annual', semi: 'semi-annual', '2': 'semi-annual',
    annual: 'annual', yearly: 'annual', '1': 'annual',
  };

  const frequency = freqMap[freqRaw];
  if (!frequency) {
    throw new Error('Frequency must be: daily, monthly, quarterly, semi-annual, or annual');
  }

  return { principal, annualRate, frequency, years };
}
