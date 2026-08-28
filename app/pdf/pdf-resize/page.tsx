import { PdfResize } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Resize PDF Pages",
  description:
    "Free online PDF page resizer. Re-lay every page onto A4, Letter, Legal or another standard size, scaling and centring the content. Runs entirely in your browser.",
};

const page = () => <PdfResize />;
export default page;
