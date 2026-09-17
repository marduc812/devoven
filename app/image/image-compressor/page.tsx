import type { Metadata } from 'next';
import { ImageCompressor } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/image-compressor', {
  title: 'Image Compressor | DevOven',
  description: 'Compress images by adjusting JPEG quality. Reduce file size without uploading to a server.',
});

export default function Page() {
  return <ImageCompressor />;
}
