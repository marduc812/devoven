import { InvertImage } from '@/Components/Functions/ImageEditTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/image/invert-image', {
  title: 'Invert Image Colors Online | DevOven',
  description: 'Free online colour inverter. Turn a photo into its negative, at full strength or part of the way, and download it. No upload — the image is processed in your browser.',
});

const page = () => <InvertImage />;
export default page;
