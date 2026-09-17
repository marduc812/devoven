import type { Metadata } from 'next';
import { WordWrap } from '@/Components/Functions/TextTools2';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/word-wrap', {
  title: 'Word Wrap | DevOven',
  description: 'Wrap text at a specified column width, or unwrap (join) lines back together, instantly in your browser.',
});

const page = () => {
  return <WordWrap />;
};

export default page;
