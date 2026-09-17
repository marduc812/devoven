import type { Metadata } from 'next';
import { PngToJpg } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/png-to-jpg', {
  title: 'PNG to JPG Converter | DevOven',
  description: 'Convert PNG images to JPG format online. Adjust quality and download instantly, no upload required. Instant PNG to JPG conversion.',
});

export default function Page() {
  return <PngToJpg />;
}
