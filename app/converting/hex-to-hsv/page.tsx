import { HexToHsv } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-to-hsv', {
  title: 'Online HEX to HSV Color Converter',
  description: 'Free online HEX to HSV color converter. Paste a hex code and get HSV values instantly. Instant HEX to HSV Color conversion.',
});

const page = () => <HexToHsv />;
export default page;
