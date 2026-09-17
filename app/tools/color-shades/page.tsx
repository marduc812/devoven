import { ColorShadesGenerator } from '@/Components/Functions/DevTools2';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/color-shades', {
  title: 'Color Shades Generator - DevOven',
  description: 'Generate a Tailwind-style palette of 10 light-to-dark shades from any hex color. See hex and HSL values for each shade.',
});

const page = () => <ColorShadesGenerator />;
export default page;
