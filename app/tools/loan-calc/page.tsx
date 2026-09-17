import { LoanCalculator } from '@/Components/Functions/LoanCalcTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/loan-calc', {
  title: 'Loan / Mortgage Calculator | DevOven',
  description: 'Calculate monthly payment, total payment, and total interest for any loan or mortgage. Includes a 12-month amortization schedule.',
});

const page = () => <LoanCalculator />;
export default page;
