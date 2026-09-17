import { CssGradientGenerator } from '@/Components/Functions/CssGradientTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/css-gradient', {
  title: 'CSS Gradient Generator - DevOven',
  description: 'Generate CSS linear, radial, and conic gradient code from a simple config. Get standard and vendor-prefixed CSS background property values.',
});

const page = () => <CssGradientGenerator />;
export default page;
