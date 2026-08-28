import type { Metadata } from 'next';
import { ImageToBase64 } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'Image to Base64 Converter | DevOven',
  description: 'Convert any image to a Base64-encoded data URI for embedding in HTML, CSS, or JSON. Instant Image to Base64 conversion.',
};

export default function Page() {
  return <ImageToBase64 />;
}
