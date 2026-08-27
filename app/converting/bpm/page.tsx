import { BpmConverter } from '@/Components/Functions/BpmTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BPM / MS Converter | DevOven',
  description: 'Convert beats per minute (BPM) to milliseconds and view note durations for all common note values. Useful for musicians, audio engineers, and animation timing. Instant BPM / MS conversion.',
};

const page = () => <BpmConverter />;
export default page;
