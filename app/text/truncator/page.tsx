import type { Metadata } from 'next';
import { TextTruncator } from '@/Components/Functions/TextTools2';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/truncator', {
  title: 'Text Truncator | DevOven',
  description: 'Truncate text to a character, word, or line limit with a configurable ellipsis, in your browser.',
});

const page = () => {
  return <TextTruncator />;
};

export default page;
