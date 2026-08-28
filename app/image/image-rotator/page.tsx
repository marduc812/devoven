import type { Metadata } from 'next';
import { ImageRotator } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'Image Rotator & Flipper | DevOven',
  description: 'Rotate images 90°, 180°, or flip horizontally/vertically in your browser. No upload required.',
};

export default function Page() {
  return <ImageRotator />;
}
