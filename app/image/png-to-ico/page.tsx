import type { Metadata } from 'next';
import { PngToIco } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/png-to-ico', {
  title: 'PNG to ICO Converter | DevOven',
  description: 'Convert PNG images to multi-size ICO favicon files (16x16, 32x32, 48x48) entirely in your browser. Instant PNG to ICO conversion.',
});

export default function Page() {
  return <PngToIco />;
}
