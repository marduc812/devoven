import type { Metadata } from 'next';
import { HeicToJpg } from '@/Components/Functions/ImageTools';

export const metadata: Metadata = {
  title: 'HEIC to JPG Converter | DevOven',
  description: 'Convert Apple HEIC/HEIF photos to JPG online. Runs in your browser — files are never uploaded to a server. Instant HEIC to JPG conversion.',
};

export default function Page() {
  return <HeicToJpg />;
}
