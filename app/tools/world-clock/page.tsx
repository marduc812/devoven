import { WorldClock } from '@/Components/Functions/WorldClockTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'World Clock — Time in All Timezones | DevOven',
  description: 'See the current time or any ISO date in all major world timezones instantly in your browser.',
};

const page = () => {
  return (
    <>
      <WorldClock />
    </>
  );
};

export default page;
