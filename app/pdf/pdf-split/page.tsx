import { PdfSplit } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Split PDF",
  description:
    "Free online PDF splitter. Extract selected page ranges into a new PDF, or break a document into one file per page. Runs entirely in your browser — your file is never uploaded.",
};

const page = () => <PdfSplit />;
export default page;
