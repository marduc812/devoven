import type { Metadata } from 'next';
import { TextEscape } from '@/Components/Functions/TextEscapeTools';

export const metadata: Metadata = {
  title: 'Text Escape / Unescape | DevOven',
  description: 'Escape and unescape text for HTML, JSON, Regex, SQL, Shell, and CSV contexts instantly in your browser.',
};

const page = () => {
  return <TextEscape />;
};

export default page;
