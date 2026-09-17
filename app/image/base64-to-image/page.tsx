import type { Metadata } from 'next';
import { Base64ToImage } from '@/Components/Functions/ImageTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/base64-to-image', {
  title: 'Base64 to Image Converter | DevOven',
  description: 'Paste a Base64 data URI to preview and download the decoded image. Supports all common image formats. Instant Base64 to Image conversion.',
});

export default function Page() {
  return <Base64ToImage />;
}
