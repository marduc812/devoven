import { CalendarWeekCalculator } from '@/Components/Functions/CalendarWeekTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/calendar-week', {
  title: 'Business Days Calculator — Working Days Between Two Dates | DevOven',
  description: 'Count the working days between two dates, excluding weekends, and see the calendar week, quarter and day of year for each. Accepts ISO, US and long-form dates.',
});

const page = () => <CalendarWeekCalculator />;
export default page;
