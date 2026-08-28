export type TermUnit = 'months' | 'years';

export interface LoanAmortInputs {
  loanAmount: number;
  annualRate: number;
  term: number;
  termUnit: TermUnit;
}

export interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

export interface LoanAmortResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  totalMonths: number;
  schedule: AmortRow[]; // first 12 months
  principalPct: number; // % of total payment that is principal
  interestPct: number;
}

export function calculateLoanAmortization(inputs: LoanAmortInputs): LoanAmortResult {
  const { loanAmount, annualRate, term, termUnit } = inputs;
  if (loanAmount <= 0) throw new Error('Loan amount must be positive');
  if (annualRate < 0) throw new Error('Interest rate cannot be negative');
  if (term <= 0) throw new Error('Term must be positive');

  const totalMonths = termUnit === 'years' ? Math.round(term * 12) : Math.round(term);
  if (totalMonths < 1 || totalMonths > 600) throw new Error('Term must be between 1 month and 50 years');

  const r = annualRate / 100 / 12;

  let monthlyPayment: number;
  if (r === 0) {
    monthlyPayment = loanAmount / totalMonths;
  } else {
    const factor = Math.pow(1 + r, totalMonths);
    monthlyPayment = (loanAmount * r * factor) / (factor - 1);
  }

  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  const schedule: AmortRow[] = [];
  let balance = loanAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const showMonths = Math.min(totalMonths, 12);

  for (let month = 1; month <= showMonths; month++) {
    const interest = balance * r;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    cumulativePrincipal += principal;
    cumulativeInterest += interest;
    schedule.push({
      month,
      payment: monthlyPayment,
      principal,
      interest,
      balance,
      cumulativePrincipal,
      cumulativeInterest,
    });
  }

  const principalPct = totalPayment > 0 ? (loanAmount / totalPayment) * 100 : 0;
  const interestPct = 100 - principalPct;

  return { monthlyPayment, totalPayment, totalInterest, totalMonths, schedule, principalPct, interestPct };
}

export function formatAmortResult(inputs: LoanAmortInputs): string {
  const result = calculateLoanAmortization(inputs);
  const fmt = (n: number) => n.toFixed(2);
  const fmtPct = (n: number) => n.toFixed(1);
  const termLabel = inputs.termUnit === 'years'
    ? `${inputs.term} year(s) (${result.totalMonths} months)`
    : `${result.totalMonths} month(s)`;

  const lines: string[] = [
    '=== Loan Amortization Summary ===',
    `Loan Amount:      $${fmt(inputs.loanAmount)}`,
    `Annual Rate:      ${inputs.annualRate}%`,
    `Term:             ${termLabel}`,
    '',
    `Monthly Payment:  $${fmt(result.monthlyPayment)}`,
    `Total Paid:       $${fmt(result.totalPayment)}`,
    `Total Interest:   $${fmt(result.totalInterest)}`,
    '',
    '=== Principal vs Interest Breakdown ===',
    `Principal:        ${fmtPct(result.principalPct)}% of total payments ($${fmt(inputs.loanAmount)})`,
    `Interest:         ${fmtPct(result.interestPct)}% of total payments ($${fmt(result.totalInterest)})`,
    '',
    `=== Amortization Schedule (First ${result.schedule.length} Month${result.schedule.length > 1 ? 's' : ''}) ===`,
    'Month | Payment    | Principal  | Interest   | Balance    | Cum. Principal | Cum. Interest',
    '------+------------+------------+------------+------------+----------------+---------------',
  ];

  for (const row of result.schedule) {
    const m = String(row.month).padStart(5);
    const pay = ('$' + fmt(row.payment)).padStart(10);
    const pri = ('$' + fmt(row.principal)).padStart(10);
    const int = ('$' + fmt(row.interest)).padStart(10);
    const bal = ('$' + fmt(row.balance)).padStart(10);
    const cumPri = ('$' + fmt(row.cumulativePrincipal)).padStart(14);
    const cumInt = ('$' + fmt(row.cumulativeInterest)).padStart(13);
    lines.push(`${m} | ${pay} | ${pri} | ${int} | ${bal} | ${cumPri} | ${cumInt}`);
  }

  return lines.join('\n');
}

export function parseLoanAmortInput(input: string, termUnit: TermUnit): LoanAmortInputs {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 3) throw new Error('Enter loan amount, annual rate (%), and term — one per line');

  const loanAmount = parseFloat(lines[0].replace(/[^0-9.]/g, ''));
  const annualRate = parseFloat(lines[1].replace(/[^0-9.]/g, ''));
  const term = parseFloat(lines[2].replace(/[^0-9.]/g, ''));

  if (isNaN(loanAmount) || isNaN(annualRate) || isNaN(term)) {
    throw new Error('All values must be valid numbers');
  }

  return { loanAmount, annualRate, term, termUnit };
}
