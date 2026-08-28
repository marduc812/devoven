import { ContinuedFractionCalc } from '@/Components/Functions/ContinuedFractionTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Continued Fraction Calculator | DevOven',
  description: 'Compute continued fraction representations of decimals and fractions. Shows CF notation, convergents, and rational approximations. Famous constants π, e, √2, φ included.',
};

const page = () => <ContinuedFractionCalc />;
export default page;
