import { HslToRgb } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hsl-to-rgb', {
  title: 'Online HSL to RGB Color Converter',
  description: 'Free online HSL to RGB color converter. Enter HSL values and get RGB output instantly. Instant HSL to RGB Color conversion.',
});

const page = () => <HslToRgb />;
export default page;
