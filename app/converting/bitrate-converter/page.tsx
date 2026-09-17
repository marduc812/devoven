import { BitrateConverter } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/bitrate-converter', {
  title: 'Online Bitrate Converter',
  description: 'Free online bitrate converter. Convert between bits per second, kilobits per second, megabits per second, and gigabits per second using base-1000 prefixes. Instant Bitrate conversion.',
});

const page = () => <BitrateConverter />;
export default page;
