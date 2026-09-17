import { PdfToImages } from '@/Components/Functions/PdfToImagesTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/pdf/pdf-to-images', {
  title: 'PDF to Images (PNG / JPG)',
  description:
    'Free online PDF to image converter. Turn each page of a PDF into a PNG or JPG at your chosen resolution and download them. All processing is done locally in your browser.',
});

const page = () => <PdfToImages />;
export default page;
