import { BitrateConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Bitrate Converter',
  description: 'Free online bitrate converter. Convert between bits per second, kilobits per second, megabits per second, and gigabits per second using base-1000 prefixes. Instant Bitrate conversion.',
};

const page = () => <BitrateConverter />;
export default page;
