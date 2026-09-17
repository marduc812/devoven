import { CssAnimationGenerator } from '@/Components/Functions/CssAnimationTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/css-animation', {
  title: 'CSS Animation Generator — DevOven',
  description: 'Generate CSS @keyframes animations visually. Set duration, timing function, direction, and fill mode, then copy the generated CSS code.',
});

const page = () => (
  <>
    <CssAnimationGenerator />
  </>
);

export default page;
