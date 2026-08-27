import type { Metadata } from 'next';
import { WebpToPng } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'WebP to PNG Converter | DevOven',
  description: 'Convert WebP images to PNG format online for maximum browser compatibility. No upload required. Instant WebP to PNG conversion.',
};

export default function Page() {
  return <WebpToPng />;
}
