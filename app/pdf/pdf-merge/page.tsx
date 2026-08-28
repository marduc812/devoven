import { PdfMerge } from '@/Components/Functions/PdfMergeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merge PDF Files',
  description:
    'Free online PDF merger. Combine multiple PDFs into a single document, reorder the files, and download the result. All processing is done locally in your browser.',
};

const page = () => <PdfMerge />;
export default page;
