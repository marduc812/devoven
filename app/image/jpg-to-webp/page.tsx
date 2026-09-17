import type { Metadata } from 'next';
import { JpgToWebp } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/jpg-to-webp', {
  title: 'JPG to WebP Converter | DevOven',
  description: 'Convert JPG images to WebP format for smaller file sizes. Free, browser-based, no upload required. Instant JPG to WebP conversion.',
});

export default function Page() {
  return <JpgToWebp />;
}
