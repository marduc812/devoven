import type { Metadata } from 'next';
import { WordCounter } from '@/Components/Functions/TextUtilities';

export const metadata: Metadata = {
  title: 'Word & Character Counter | DevOven',
  description: 'Count words, characters (with and without spaces), lines, and sentences in any text. Live browser-side statistics.',
};

const page = () => {
  return <WordCounter />;
};

export default page;
