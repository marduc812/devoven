import { HsvToHex } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online HSV to HEX Color Converter',
  description: 'Free online HSV to HEX color converter. Enter HSV values and get the hex color code instantly. Instant HSV to HEX Color conversion.',
};

const page = () => <HsvToHex />;
export default page;
