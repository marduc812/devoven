import { DateDiffCalculator } from '@/Components/Functions/DateDiffTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Date Difference Calculator | DevOven',
  description: 'Calculate the difference between two dates. Shows total days, weeks, months, years, hours, and milliseconds.',
};

const page = () => <DateDiffCalculator />;
export default page;
