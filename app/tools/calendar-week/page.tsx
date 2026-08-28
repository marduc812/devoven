import type { Metadata } from 'next';
import { CalendarWeekCalculator } from '@/Components/Functions/CalendarWeekTools';

export const metadata: Metadata = {
  title: 'Calendar Week Calculator | DevOven',
  description: 'Find the ISO week number, day of year, quarter, and full Mon-Sun week for any date. Calculate business days between two dates. Supports ISO, US, and long-form date formats.',
};

export default function Page() {
  return <CalendarWeekCalculator />;
}
