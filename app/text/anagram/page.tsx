import { AnagramChecker } from '@/Components/Functions/AnagramTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/anagram', {
  title: 'Anagram Checker — Check Two Words or Phrases | DevOven',
  description: 'Check if two words or phrases are anagrams of each other. See letter frequency differences.',
});

const page = () => {
  return (
    <>
      <AnagramChecker />
    </>
  );
};

export default page;
