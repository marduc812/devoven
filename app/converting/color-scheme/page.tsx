import { ColorSchemeGenerator } from '@/Components/Functions/ColorSchemeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Color Scheme Generator - DevOven',
  description: 'Generate color schemes from a hex color. Get complementary, triadic, tetradic, analogous, split-complementary, and monochromatic palettes.',
};

const page = () => <ColorSchemeGenerator />;
export default page;
