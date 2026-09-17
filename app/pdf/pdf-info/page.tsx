import { PdfInfo } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/pdf/pdf-info', {
  title: "PDF Info",
  description:
    "Free online PDF inspector. See page count, page sizes, rotation, title, author, producer, dates and form fields. Runs entirely in your browser — your file is never uploaded.",
});

const page = () => <PdfInfo />;
export default page;
