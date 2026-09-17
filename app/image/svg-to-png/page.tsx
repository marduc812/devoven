import type { Metadata } from 'next';
import { SvgToPng } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/svg-to-png', {
  title: 'SVG to PNG Converter | DevOven',
  description: 'Convert SVG vector files to PNG raster images in your browser. Set custom output dimensions. Instant SVG to PNG conversion.',
});

export default function Page() {
  return <SvgToPng />;
}
