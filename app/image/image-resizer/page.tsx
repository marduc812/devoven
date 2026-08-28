import type { Metadata } from 'next';
import { ImageResizer } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'Image Resizer | DevOven',
  description: 'Resize images to a custom width and height in your browser. Optionally maintain aspect ratio.',
};

export default function Page() {
  return <ImageResizer />;
}
