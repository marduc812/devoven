import { HtmlFormatter } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML Formatter & Minifier — DevOven',
  description: 'Format or minify HTML online using Prettier. Get clean, indented HTML or collapse whitespace for production.',
};

const page = () => (
  <>
    <HtmlFormatter />
  </>
);

export default page;
