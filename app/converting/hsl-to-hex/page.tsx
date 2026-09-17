import { HslToHex } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hsl-to-hex', {
  title: 'Online HSL to HEX Color Converter',
  description: 'Free online HSL to HEX color converter. Enter HSL values and get the hex color code instantly. Instant HSL to HEX Color conversion.',
});

const page = () => <HslToHex />;
export default page;
