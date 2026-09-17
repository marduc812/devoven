import type { Metadata } from 'next';
import { ImageRotator } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/image-rotator', {
  title: 'Image Rotator | DevOven',
  description: 'Rotate an image 90° clockwise, 90° counter-clockwise or 180° in your browser. No upload required. To mirror an image instead, use the Flip Image tool.',
});

export default function Page() {
  return <ImageRotator />;
}
