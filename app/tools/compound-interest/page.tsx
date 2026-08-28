import { CompoundInterestCalculator } from '@/Components/Functions/CompoundInterestTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compound Interest Calculator | DevOven',
  description: 'Calculate compound interest with daily, monthly, quarterly, semi-annual, or annual compounding. View year-by-year growth and effective annual rate.',
};

const page = () => <CompoundInterestCalculator />;
export default page;
