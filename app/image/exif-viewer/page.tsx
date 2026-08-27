import type { Metadata } from 'next';
import { ExifViewer } from '@/Components/Functions/ExifTools';

export const metadata: Metadata = {
  title: 'EXIF Viewer — See the Hidden Data in Your Photos | DevOven',
  description: 'View EXIF metadata in JPEG, PNG, WebP and TIFF images: camera, lens, timestamps, software and GPS coordinates, with a plain-language privacy report. Runs entirely in your browser — no upload.',
};

export default function Page() {
  return <ExifViewer />;
}
