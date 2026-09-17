import { WorldClock } from '@/Components/Functions/WorldClockTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/world-clock', {
  title: 'World Clock — Time in All Timezones | DevOven',
  description: 'See the current time or any ISO date in all major world timezones instantly in your browser.',
});

const page = () => {
  return (
    <>
      <WorldClock />
    </>
  );
};

export default page;
