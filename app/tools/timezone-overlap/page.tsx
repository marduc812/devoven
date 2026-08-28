import type { Metadata } from 'next';
import { TimezoneOverlapFinder } from '@/Components/Functions/TimezoneOverlapTools';

export const metadata: Metadata = {
  title: 'Timezone Overlap Finder | DevOven',
  description: 'Find working hours overlap between 2-4 timezones. Shows a 24-hour grid, identifies 9am-5pm overlap windows, and suggests the best meeting times. Supports UTC, EST, PST, JST, CET, IST, AEST, and UTC offsets.',
};

export default function Page() {
  return <TimezoneOverlapFinder />;
}
