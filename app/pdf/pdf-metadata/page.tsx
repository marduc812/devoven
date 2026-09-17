import { PdfMetadataEditor } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/pdf/pdf-metadata', {
  title: "PDF Metadata Editor",
  description:
    "Free online PDF metadata editor. View and rewrite a PDF’s title, author, subject, keywords, creator and producer, then download the result. Runs entirely in your browser.",
});

const page = () => <PdfMetadataEditor />;
export default page;
