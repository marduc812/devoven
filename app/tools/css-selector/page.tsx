import { CssSelectorExtractor } from '@/Components/Functions/MarkupQueryTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Selector Extractor & Tester',
  description:
    'Run a CSS selector over pasted HTML and extract what it matches: text, attributes, the matched markup or JSON. Combinators, selector lists, :not, :is and :has, all client-side.',
};

const page = () => <CssSelectorExtractor />;
export default page;
