import type { Metadata } from 'next';
import { EmojiRemover } from '@/Components/Functions/TextTools2';

export const metadata: Metadata = {
  title: 'Emoji Remover | DevOven',
  description: 'Remove all emoji characters from text, or extract just the emojis, instantly in your browser.',
};

const page = () => {
  return <EmojiRemover />;
};

export default page;
