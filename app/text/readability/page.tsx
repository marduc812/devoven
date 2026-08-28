import { ReadabilityAnalyzer } from '@/Components/Functions/ReadabilityTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Readability Analyzer - DevOven',
  description: 'Analyze text readability with Flesch-Kincaid Grade Level and Flesch Reading Ease scores. Get word frequency, sentence length, and syllable statistics.',
};

const page = () => <ReadabilityAnalyzer />;
export default page;
