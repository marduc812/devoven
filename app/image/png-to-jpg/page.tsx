import type { Metadata } from 'next';
import { PngToJpg } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'PNG to JPG Converter | DevOven',
  description: 'Convert PNG images to JPG format online. Adjust quality and download instantly, no upload required. Instant PNG to JPG conversion.',
};

export default function Page() {
  return <PngToJpg />;
}
