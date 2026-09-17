import { Timer } from '@/Components/Functions/TimerTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/timer', {
  title: 'Timer & Stopwatch — Countdown and Lap Timer | DevOven',
  description: 'Free online countdown timer and stopwatch with lap times. Runs entirely in your browser and stays accurate in background tabs.',
});

const page = () => {
  return (
    <>
      <Timer />
    </>
  );
};

export default page;
