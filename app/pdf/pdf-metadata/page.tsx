import { PdfMetadataEditor } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "PDF Metadata Editor",
  description:
    "Free online PDF metadata editor. View and rewrite a PDF’s title, author, subject, keywords, creator and producer, then download the result. Runs entirely in your browser.",
};

const page = () => <PdfMetadataEditor />;
export default page;
