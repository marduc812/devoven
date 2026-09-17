import type { Metadata } from 'next';
import { ImageResizer } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/image-resizer', {
  title: 'Image Resizer | DevOven',
  description: 'Resize images to a custom width and height in your browser. Optionally maintain aspect ratio.',
});

export default function Page() {
  return <ImageResizer />;
}
