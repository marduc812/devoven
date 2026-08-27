import type { Metadata } from 'next';
import { DuplicateFinder } from '@/Components/Functions/DuplicateFinderTools';

export const metadata: Metadata = {
  title: 'Duplicate Finder | DevOven',
  description: 'Find duplicate words, phrases, and similar lines in text. Detect repeated content instantly in your browser.',
};

const page = () => {
  return <DuplicateFinder />;
};

export default page;
