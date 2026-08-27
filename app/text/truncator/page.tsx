import type { Metadata } from 'next';
import { TextTruncator } from '@/Components/Functions/TextTools2';

export const metadata: Metadata = {
  title: 'Text Truncator | DevOven',
  description: 'Truncate text to a character, word, or line limit with a configurable ellipsis, in your browser.',
};

const page = () => {
  return <TextTruncator />;
};

export default page;
