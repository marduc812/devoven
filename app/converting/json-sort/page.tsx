import { JsonSorter } from '@/Components/Functions/JsonSortTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online JSON Key Sorter',
  description: 'Free online JSON key sorter. Sort all keys in a JSON object alphabetically, recursively through nested objects and arrays. Normalize JSON structure and reduce diff noise.',
};

const page = () => <JsonSorter />;
export default page;
