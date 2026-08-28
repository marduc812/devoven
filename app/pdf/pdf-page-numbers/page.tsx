import { PdfPageNumbers } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF",
  description:
    "Free online tool to add page numbers to a PDF. Choose the format, position, font size and starting page, then download the numbered document. Runs entirely in your browser.",
};

const page = () => <PdfPageNumbers />;
export default page;
