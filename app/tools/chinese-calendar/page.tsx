import { ChineseCalendar } from '@/Components/Functions/ChineseCalendarTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/chinese-calendar', {
  title: 'Chinese New Year Calculator | DevOven',
  description: 'Calculate Chinese New Year date, zodiac animal, element, heavenly stem, and earthly branch for any Gregorian year from 1900 to 2100.',
});

const page = () => <ChineseCalendar />;
export default page;
