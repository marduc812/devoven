import type { Metadata } from 'next';
import { RemoveDiacritics } from '@/Components/Functions/TextCleanupTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/remove-diacritics', {
  title: 'Remove Diacritics | DevOven',
  description: 'Strip accents and combining marks from text in your browser. Crème Brûlée becomes Creme Brulee, and the fold option also handles ø, ł, æ and ß.',
});

const page = () => {
  return <RemoveDiacritics />;
};

export default page;
