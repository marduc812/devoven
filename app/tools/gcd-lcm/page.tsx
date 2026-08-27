import { GcdLcmCalculator } from '@/Components/Functions/GcdLcmTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GCD & LCM Calculator | DevOven',
  description: 'Calculate the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of two or more numbers. Supports space or comma separated input.',
};

const page = () => <GcdLcmCalculator />;
export default page;
