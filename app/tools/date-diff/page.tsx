import { DateDiffCalculator } from '@/Components/Functions/DateDiffTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/date-diff', {
  title: 'Date Difference Calculator | DevOven',
  description: 'Calculate the difference between two dates. Shows total days, weeks, months, years, hours, and milliseconds.',
});

const page = () => <DateDiffCalculator />;
export default page;
