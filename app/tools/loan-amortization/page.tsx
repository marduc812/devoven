import type { Metadata } from 'next';
import { LoanAmortizationCalculator } from '@/Components/Functions/LoanAmortizationTools';

export const metadata: Metadata = {
  title: 'Loan Amortization Calculator | DevOven',
  description: 'Calculate loan amortization schedules. Enter loan amount, interest rate, and term to see monthly payments, principal vs interest breakdown, and a full amortization table.',
};

export default function Page() {
  return <LoanAmortizationCalculator />;
}
