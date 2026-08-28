export type TaxMode = 'add' | 'extract';

export interface TaxInputs {
  amount: number;
  rate: number;
  mode: TaxMode;
}

export interface TaxResult {
  preTax: number;
  taxAmount: number;
  postTax: number;
}

export const COMMON_TAX_RATES: { label: string; rate: number }[] = [
  { label: 'EU Standard VAT (avg ~21%)', rate: 21 },
  { label: 'UK VAT', rate: 20 },
  { label: 'Germany VAT', rate: 19 },
  { label: 'France VAT', rate: 20 },
  { label: 'Spain VAT', rate: 21 },
  { label: 'Italy VAT', rate: 22 },
  { label: 'Netherlands VAT', rate: 21 },
  { label: 'Poland VAT', rate: 23 },
  { label: 'Sweden VAT', rate: 25 },
  { label: 'Denmark VAT', rate: 25 },
  { label: 'Norway VAT', rate: 25 },
  { label: 'Switzerland VAT', rate: 7.7 },
  { label: 'US California Sales Tax', rate: 7.25 },
  { label: 'US New York Sales Tax', rate: 8.52 },
  { label: 'US Texas Sales Tax', rate: 6.25 },
  { label: 'Australia GST', rate: 10 },
  { label: 'Canada HST (Ontario)', rate: 13 },
  { label: 'Japan Consumption Tax', rate: 10 },
];

export function calculateTax(inputs: TaxInputs): TaxResult {
  const { amount, rate, mode } = inputs;
  if (amount < 0) throw new Error('Amount cannot be negative');
  if (rate < 0 || rate > 100) throw new Error('Tax rate must be between 0 and 100');

  if (mode === 'add') {
    const preTax = amount;
    const taxAmount = (amount * rate) / 100;
    const postTax = preTax + taxAmount;
    return { preTax, taxAmount, postTax };
  } else {
    // Extract tax from tax-inclusive price
    const postTax = amount;
    const preTax = amount / (1 + rate / 100);
    const taxAmount = postTax - preTax;
    return { preTax, taxAmount, postTax };
  }
}

export function formatTaxResult(inputs: TaxInputs): string {
  const result = calculateTax(inputs);
  const fmt = (n: number) => n.toFixed(2);
  const modeLabel = inputs.mode === 'add' ? 'Add Tax to Price' : 'Extract Tax from Inclusive Price';

  const lines: string[] = [
    `=== VAT / Tax Calculator (${modeLabel}) ===`,
    `Amount entered:  $${fmt(inputs.amount)}`,
    `Tax Rate:        ${inputs.rate}%`,
    '',
    `Pre-tax amount:  $${fmt(result.preTax)}`,
    `Tax amount:      $${fmt(result.taxAmount)}`,
    `Post-tax total:  $${fmt(result.postTax)}`,
    '',
    '=== Common Tax Rate Reference ===',
  ];

  for (const entry of COMMON_TAX_RATES) {
    let row: TaxResult;
    try {
      row = calculateTax({ amount: inputs.amount, rate: entry.rate, mode: inputs.mode });
    } catch {
      continue;
    }
    const tax = fmt(row.taxAmount);
    const total = fmt(inputs.mode === 'add' ? row.postTax : row.preTax);
    const label = entry.label.padEnd(35);
    lines.push(`${label} ${entry.rate}%  →  tax: $${tax}  total: $${total}`);
  }

  return lines.join('\n');
}

export function parseTaxInput(input: string, mode: TaxMode): TaxInputs {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error('Enter amount and tax rate (%) — one per line');

  const amount = parseFloat(lines[0].replace(/[^0-9.]/g, ''));
  const rate = parseFloat(lines[1].replace(/[^0-9.]/g, ''));

  if (isNaN(amount) || isNaN(rate)) throw new Error('Amount and rate must be valid numbers');

  return { amount, rate, mode };
}
