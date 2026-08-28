import { WeekNumberCalculator } from '@/Components/Functions/DateTimeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Week Number Calculator',
  description: 'Free online week number calculator. Find the ISO 8601 week number, US week number, day of year, and days until year end for any date.',
};

const page = () => <WeekNumberCalculator />;
export default page;
