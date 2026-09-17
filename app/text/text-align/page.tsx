import { TextAlign } from '@/Components/Functions/TextAlignTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/text-align', {
  title: 'Text Alignment Tool',
  description: 'Pad and align text in fixed-width columns. Align left, right, center, auto-align tab-delimited columns, or word wrap at a custom width.',
});

const page = () => <TextAlign />;
export default page;
