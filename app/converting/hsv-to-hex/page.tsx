import { HsvToHex } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hsv-to-hex', {
  title: 'Online HSV to HEX Color Converter',
  description: 'Free online HSV to HEX color converter. Enter HSV values and get the hex color code instantly. Instant HSV to HEX Color conversion.',
});

const page = () => <HsvToHex />;
export default page;
