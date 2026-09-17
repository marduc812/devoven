import { PdfOrganize } from '@/Components/Functions/PdfOrganizeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/pdf/pdf-organize', {
  title: 'Rotate & Organize PDF Pages',
  description:
    'Free online PDF organizer. Rotate, reorder, and delete PDF pages, then download a new file. All processing is done locally in your browser.',
});

const page = () => <PdfOrganize />;
export default page;
