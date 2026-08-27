import { ImagesToPdf } from '@/Components/Functions/ImagesToPdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Images to PDF (JPG / PNG to PDF)',
  description:
    'Free online image to PDF converter. Combine JPG, PNG, and other images into a single PDF, reorder them, and pick a page size. All processing is done locally in your browser.',
};

const page = () => <ImagesToPdf />;
export default page;
