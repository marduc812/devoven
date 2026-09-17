import type { Metadata } from 'next';
import { SortLines } from '@/Components/Functions/TextUtilities';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/sort-lines', {
  title: 'Sort Lines | DevOven',
  description: 'Sort lines of text alphabetically ascending (A-Z) or descending (Z-A), instantly in your browser.',
});

const page = () => <SortLines />;
export default page;
