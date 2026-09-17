import { PdfCompress } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Compress PDF",
  description:
    "Free online PDF compressor. Shrink a PDF by re-encoding the images inside it, with phone scans typically coming out 80-95% smaller while the text stays selectable. Runs entirely in your browser.",
};

const page = () => <PdfCompress />;
export default page;
