import { TaylorSeriesCalculator } from '@/Components/Functions/TaylorSeriesTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Taylor Series Calculator | DevOven',
  description: 'Compute Taylor series approximations for sin, cos, eˣ, ln(1+x), 1/(1-x), and arctan. Compare exact values with approximations at 1, 2, 3, 5, 10, and 20 terms.',
};

const page = () => <TaylorSeriesCalculator />;
export default page;
