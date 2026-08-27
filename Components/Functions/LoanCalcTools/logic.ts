export interface LoanInputs {
  principal: number;
  annualRate: number;
  termYears: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortization: AmortizationRow[];
}

export function calculateLoan(inputs: LoanInputs): LoanResult {
  const { principal, annualRate, termYears } = inputs;
  if (principal <= 0) throw new Error('Principal must be positive');
  if (annualRate < 0) throw new Error('Interest rate cannot be negative');
  if (termYears <= 0) throw new Error('Term must be positive');

  const n = termYears * 12;
  const r = annualRate / 100 / 12;

  let monthlyPayment: number;
  if (r === 0) {
    monthlyPayment = principal / n;
  } else {
    const factor = Math.pow(1 + r, n);
    monthlyPayment = (principal * r * factor) / (factor - 1);
  }

  const totalPayment = monthlyPayment * n;
  const totalInterest = totalPayment - principal;

  const amortization: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; month <= Math.min(n, 12); month++) {
    const interest = balance * r;
    const principalPaid = monthlyPayment - interest;
    balance = balance - principalPaid;
    if (balance < 0) balance = 0;
    amortization.push({
      month,
      payment: monthlyPayment,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return { monthlyPayment, totalPayment, totalInterest, amortization };
}

export function formatLoanResult(inputs: LoanInputs): string {
  const result = calculateLoan(inputs);
  const fmt = (n: number) => n.toFixed(2);

  const lines: string[] = [
    '=== Loan Summary ===',
    `Monthly Payment:  $${fmt(result.monthlyPayment)}`,
    `Total Payment:    $${fmt(result.totalPayment)}`,
    `Total Interest:   $${fmt(result.totalInterest)}`,
    '',
    '=== Amortization Schedule (First 12 Months) ===',
    'Month | Payment    | Principal  | Interest   | Balance',
    '------+------------+------------+------------+------------',
  ];

  for (const row of result.amortization) {
    const m = String(row.month).padStart(5);
    const p = ('$' + fmt(row.payment)).padStart(10);
    const pr = ('$' + fmt(row.principal)).padStart(10);
    const i = ('$' + fmt(row.interest)).padStart(10);
    const b = ('$' + fmt(row.balance)).padStart(10);
    lines.push(`${m} | ${p} | ${pr} | ${i} | ${b}`);
  }

  return lines.join('\n');
}

export interface LoanYear {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// `calculateLoan` stops at 12 rows because its text output only ever printed the
// first year. The UI draws the whole payoff, so it needs every month.
export function fullAmortization(inputs: LoanInputs): AmortizationRow[] {
  const { monthlyPayment } = calculateLoan(inputs);
  const months = Math.max(1, Math.round(inputs.termYears * 12));
  const r = inputs.annualRate / 100 / 12;

  const rows: AmortizationRow[] = [];
  let balance = inputs.principal;

  for (let month = 1; month <= months; month++) {
    const interest = balance * r;
    // The last instalment settles whatever is actually left rather than paying the
    // level amount, so the schedule closes at zero instead of a rounding crumb.
    const scheduled = month === months ? balance : monthlyPayment - interest;
    const principalPaid = Math.min(Math.max(scheduled, 0), balance);

    balance -= principalPaid;
    if (balance < 1e-9) balance = 0;

    rows.push({ month, payment: principalPaid + interest, principal: principalPaid, interest, balance });
  }

  return rows;
}

export function yearlyAmortization(inputs: LoanInputs): LoanYear[] {
  const years: LoanYear[] = [];

  for (const row of fullAmortization(inputs)) {
    const index = Math.ceil(row.month / 12) - 1;
    if (!years[index]) {
      years[index] = { year: index + 1, payment: 0, principal: 0, interest: 0, balance: row.balance };
    }
    years[index].payment += row.payment;
    years[index].principal += row.principal;
    years[index].interest += row.interest;
    years[index].balance = row.balance;
  }

  return years;
}

export function parseLoanInput(input: string): LoanInputs {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 3) throw new Error('Enter principal, annual rate (%), and term (years) — one per line');

  const principal = parseFloat(lines[0].replace(/[^0-9.]/g, ''));
  const annualRate = parseFloat(lines[1].replace(/[^0-9.]/g, ''));
  const termYears = parseFloat(lines[2].replace(/[^0-9.]/g, ''));

  if (isNaN(principal) || isNaN(annualRate) || isNaN(termYears)) {
    throw new Error('All values must be valid numbers');
  }

  return { principal, annualRate, termYears };
}
