import type { Metadata } from 'next';
import { WebpToPng } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/webp-to-png', {
  title: 'WebP to PNG Converter | DevOven',
  description: 'Convert WebP images to PNG format online for maximum browser compatibility. No upload required. Instant WebP to PNG conversion.',
});

export default function Page() {
  return <WebpToPng />;
}
