import { PercentageCalculator } from '@/Components/Functions/PercentageTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/percentage', {
  title: 'Percentage Calculator | DevOven',
  description: 'Calculate percentages using natural language queries. Supports "X% of Y", "X is what % of Y", increase/decrease, and percentage change calculations.',
});

const page = () => <PercentageCalculator />;
export default page;
