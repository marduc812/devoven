import { ScrabbleScorer } from '@/Components/Functions/ScrabbleTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scrabble Word Scorer | DevOven',
  description: 'Calculate Scrabble scores for words and text. Shows per-letter values, total score, highest-scoring words, and letter value distribution.',
};

const page = () => <ScrabbleScorer />;
export default page;
