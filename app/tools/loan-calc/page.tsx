import { LoanCalculator } from '@/Components/Functions/LoanCalcTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loan / Mortgage Calculator | DevOven',
  description: 'Calculate monthly payment, total payment, and total interest for any loan or mortgage. Includes a 12-month amortization schedule.',
};

const page = () => <LoanCalculator />;
export default page;
