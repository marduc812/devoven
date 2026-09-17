import { WeekNumberCalculator } from '@/Components/Functions/DateTimeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/week-number-calculator', {
  title: 'Week Number Calculator — What Week Is It? | DevOven',
  description: 'What week number is it? Find the current ISO 8601 and US week number, or the week for any date, with its start and end dates, day of year and days until year end.',
});

/**
 * Rebuilt hourly so the rendered HTML carries today's date rather than the
 * date of the last deploy. "What week number is it this week" is the query
 * this page exists for, and a crawler that only sees an empty form cannot tell
 * that the page answers it.
 */
export const revalidate = 3600;

const page = () => {
  const now = new Date();
  const serverToday = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('-');

  return <WeekNumberCalculator serverToday={serverToday} />;
};

export default page;
