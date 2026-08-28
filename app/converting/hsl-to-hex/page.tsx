import { HslToHex } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online HSL to HEX Color Converter',
  description: 'Free online HSL to HEX color converter. Enter HSL values and get the hex color code instantly. Instant HSL to HEX Color conversion.',
};

const page = () => <HslToHex />;
export default page;
