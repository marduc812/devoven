import { MdTableGenerator } from '@/Components/Functions/MdTableTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markdown Table Builder - DevOven',
  description: 'Build Markdown tables visually with a live editor. Add/remove rows and columns, then copy the output.',
};

const page = () => <MdTableGenerator />;
export default page;
