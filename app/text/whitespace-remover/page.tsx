import type { Metadata } from 'next';
import { WhitespaceRemover } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Whitespace Remover | DevOven',
  description: 'Remove extra whitespace, trim line edges, collapse multiple spaces, and delete blank lines from any text.',
};

const page = () => <WhitespaceRemover />;
export default page;
