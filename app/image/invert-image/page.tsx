import { InvertImage } from '@/Components/Functions/ImageEditTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invert Image Colors Online | DevOven',
  description: 'Free online colour inverter. Turn a photo into its negative, at full strength or part of the way, and download it. No upload — the image is processed in your browser.',
};

const page = () => <InvertImage />;
export default page;
