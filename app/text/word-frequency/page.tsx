import { WordFrequencyTools } from '@/Components/Functions/WordFrequencyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Word Frequency Counter - DevOven',
  description: 'Count word frequencies in any text. See the top 50 words sorted by occurrence with counts and percentages.',
};

const page = () => <WordFrequencyTools />;
export default page;
