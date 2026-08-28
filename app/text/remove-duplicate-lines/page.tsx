import type { Metadata } from 'next';
import { RemoveDuplicateLines } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Remove Duplicate Lines | DevOven',
  description: 'Remove duplicate lines from any text, preserving the order of first occurrence. Fast and browser-side.',
};

const page = () => <RemoveDuplicateLines />;
export default page;
