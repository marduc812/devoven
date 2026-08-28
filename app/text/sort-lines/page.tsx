import type { Metadata } from 'next';
import { SortLines } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Sort Lines | DevOven',
  description: 'Sort lines of text alphabetically ascending (A-Z) or descending (Z-A), instantly in your browser.',
};

const page = () => <SortLines />;
export default page;
