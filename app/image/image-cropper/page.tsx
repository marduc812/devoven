import type { Metadata } from 'next';
import { ImageCropper } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/image-cropper', {
  title: 'Image Cropper | DevOven',
  description: 'Crop images by specifying a pixel region. Runs entirely in your browser with no upload.',
});

export default function Page() {
  return <ImageCropper />;
}
