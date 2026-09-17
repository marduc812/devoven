import { PdfFlatten } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/pdf/pdf-flatten', {
  title: "Flatten PDF Forms",
  description:
    "Free online PDF form flattener. Bake filled-in form values into the page so they render everywhere and can no longer be edited. Runs entirely in your browser.",
});

const page = () => <PdfFlatten />;
export default page;
