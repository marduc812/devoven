import type { Metadata } from 'next';
import { SvgToPng } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'SVG to PNG Converter | DevOven',
  description: 'Convert SVG vector files to PNG raster images in your browser. Set custom output dimensions. Instant SVG to PNG conversion.',
};

export default function Page() {
  return <SvgToPng />;
}
