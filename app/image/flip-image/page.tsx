import { FlipImage } from '@/Components/Functions/ImageEditTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flip Image Horizontally or Vertically | DevOven',
  description: 'Free online image flipper. Mirror a JPEG, PNG or WebP left to right, top to bottom, or both, keeping its size and format. Runs entirely in your browser.',
};

const page = () => <FlipImage />;
export default page;
