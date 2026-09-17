import { FlipImage } from '@/Components/Functions/ImageEditTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/flip-image', {
  title: 'Flip Image Horizontally or Vertically | DevOven',
  description: 'Free online image flipper. Mirror a JPEG, PNG or WebP left to right, top to bottom, or both, keeping its size and format. Runs entirely in your browser.',
});

const page = () => <FlipImage />;
export default page;
