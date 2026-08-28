import { BackgroundRemover } from '@/Components/Functions/BackgroundRemoverTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Background Color Remover',
  description:
    'Free online background remover for flat-colour backgrounds. Key out white or any other colour with an eyedropper, tune the tolerance and edge feather, and download a transparent PNG. Runs entirely in your browser — your image is never uploaded.',
};

const page = () => <BackgroundRemover />;
export default page;
