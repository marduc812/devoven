import { PdfLayers } from '@/Components/Functions/PdfLayersTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Layer Exporter',
  description:
    'Free online PDF layer and page exporter. Upload a PDF, toggle its optional-content layers, or pick which pages to keep, and download a new PDF. All processing is done locally in your browser.',
};

const page = () => <PdfLayers />;
export default page;
