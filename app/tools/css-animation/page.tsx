import { CssAnimationGenerator } from '@/Components/Functions/CssAnimationTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Animation Generator — DevOven',
  description: 'Generate CSS @keyframes animations visually. Set duration, timing function, direction, and fill mode, then copy the generated CSS code.',
};

const page = () => (
  <>
    <CssAnimationGenerator />
  </>
);

export default page;
