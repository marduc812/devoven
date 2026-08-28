import type { Metadata } from 'next';
import { NumberWords } from '@/Components/Functions/NumberWordsTools';

export const metadata: Metadata = {
  title: 'Number to Words (Ordinal) | DevOven',
  description: 'Convert integers to their English ordinal form in words. Supports negative numbers and values up to 999 trillion.',
};

export default function Page() {
  return <NumberWords />;
}
