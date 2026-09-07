import { RemoveExif } from '@/Components/Functions/RemoveExifTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Remove EXIF Data from Images Online | DevOven',
  description: 'Free online EXIF remover. Strip GPS coordinates, camera details, timestamps and thumbnails from a JPEG, PNG or WebP without re-compressing the image. Runs entirely in your browser.',
};

const page = () => <RemoveExif />;
export default page;
