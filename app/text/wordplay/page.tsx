import { WordplayGenerator } from '@/Components/Functions/WordplayTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wordplay Generator — Anagrams, Rhymes, Hidden Words | DevOven',
  description: 'Enter a word to find anagrams, rhymes, alliterations, hidden words within it, and near-palindromes. Great for creative writing and word games.',
};

const page = () => {
  return (
    <>
      <WordplayGenerator />
    </>
  );
};

export default page;
