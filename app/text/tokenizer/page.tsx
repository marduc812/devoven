import { TextTokenizer } from '@/Components/Functions/TokenizerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Tokenizer - DevOven',
  description: 'Split text into words, sentences, paragraphs, or lines with count analysis.',
};

const page = () => <TextTokenizer />;
export default page;
