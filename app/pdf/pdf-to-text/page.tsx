import { PdfToText } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "PDF to Text",
  description:
    "Free online PDF text extractor. Pull the text layer out of a PDF page by page and copy or download it. Runs entirely in your browser — your file is never uploaded.",
};

const page = () => <PdfToText />;
export default page;
