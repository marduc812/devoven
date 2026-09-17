import type { Metadata } from 'next';
import { TextEscape } from '@/Components/Functions/TextEscapeTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/escape', {
  title: 'Text Escape / Unescape | DevOven',
  description: 'Escape and unescape text for HTML, JSON, Regex, SQL, Shell, and CSV contexts instantly in your browser.',
});

const page = () => {
  return <TextEscape />;
};

export default page;
