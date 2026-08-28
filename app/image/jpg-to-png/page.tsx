import type { Metadata } from 'next';
import { JpgToPng } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'JPG to PNG Converter | DevOven',
  description: 'Convert JPG/JPEG images to lossless PNG format online. No upload, runs entirely in your browser. Instant JPG to PNG conversion.',
};

export default function Page() {
  return <JpgToPng />;
}
