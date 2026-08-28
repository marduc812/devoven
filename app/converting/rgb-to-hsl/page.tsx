import { RgbToHsl } from '@/Components/Functions/ColorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online RGB to HSL Color Converter',
  description: 'Free online RGB to HSL color converter. Enter RGB values and get HSL output instantly. Instant RGB to HSL Color conversion.',
};

const page = () => <RgbToHsl />;
export default page;
