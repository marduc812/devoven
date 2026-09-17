import type { Metadata } from 'next';
import { WhitespaceRemover } from '@/Components/Functions/TextUtilities';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/whitespace-remover', {
  title: 'Whitespace Remover | DevOven',
  description: 'Remove extra whitespace, trim line edges, collapse multiple spaces, and delete blank lines from any text.',
});

const page = () => <WhitespaceRemover />;
export default page;
