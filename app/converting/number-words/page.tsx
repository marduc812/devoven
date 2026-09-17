import type { Metadata } from 'next';
import { NumberWords } from '@/Components/Functions/NumberWordsTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-words', {
  title: 'Number to Words (Ordinal) | DevOven',
  description: 'Convert integers to their English ordinal form in words. Supports negative numbers and values up to 999 trillion.',
});

export default function Page() {
  return <NumberWords />;
}
