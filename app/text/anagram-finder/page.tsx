import { AnagramWordFinder } from '@/Components/Functions/AnagramFinderTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anagram Word Finder | DevOven',
  description: 'Find all valid English words that can be formed from a set of letters. Finds exact anagrams and partial anagrams, sorted by Scrabble score.',
};

const page = () => <AnagramWordFinder />;
export default page;
