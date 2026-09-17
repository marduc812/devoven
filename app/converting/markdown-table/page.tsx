import { MdTableGenerator } from '@/Components/Functions/MdTableTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/markdown-table', {
  title: 'Markdown Table Builder - DevOven',
  description: 'Build Markdown tables visually with a live editor. Add/remove rows and columns, then copy the output.',
});

const page = () => <MdTableGenerator />;
export default page;
