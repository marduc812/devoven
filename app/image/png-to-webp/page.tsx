import type { Metadata } from 'next';
import { PngToWebp } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'PNG to WebP Converter | DevOven',
  description: 'Convert PNG images to modern WebP format online for smaller file sizes. Runs in your browser. Instant PNG to WebP conversion.',
};

export default function Page() {
  return <PngToWebp />;
}
