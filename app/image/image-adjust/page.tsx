import { ImageAdjust } from '@/Components/Functions/ImageEditTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brightness, Contrast & Saturation Editor | DevOven',
  description: 'Free online image adjuster. Change the brightness, contrast and saturation of a JPEG, PNG or WebP with live preview, and download the result. Runs entirely in your browser.',
};

const page = () => <ImageAdjust />;
export default page;
