import type { Metadata } from 'next';
import { JpgToWebp } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'JPG to WebP Converter | DevOven',
  description: 'Convert JPG images to WebP format for smaller file sizes. Free, browser-based, no upload required. Instant JPG to WebP conversion.',
};

export default function Page() {
  return <JpgToWebp />;
}
