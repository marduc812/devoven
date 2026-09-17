import { CompoundInterestCalculator } from '@/Components/Functions/CompoundInterestTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/compound-interest', {
  title: 'Compound Interest Calculator | DevOven',
  description: 'Calculate compound interest with daily, monthly, quarterly, semi-annual, or annual compounding. View year-by-year growth and effective annual rate.',
});

const page = () => <CompoundInterestCalculator />;
export default page;
