import { PdfOrganize } from '@/Components/Functions/PdfOrganizeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rotate & Organize PDF Pages',
  description:
    'Free online PDF organizer. Rotate, reorder, and delete PDF pages, then download a new file. All processing is done locally in your browser.',
};

const page = () => <PdfOrganize />;
export default page;
