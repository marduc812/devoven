import { CssSelectorExtractor } from '@/Components/Functions/MarkupQueryTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/css-selector', {
  title: 'CSS Selector Extractor & Tester',
  description:
    'Run a CSS selector over pasted HTML and extract what it matches: text, attributes, the matched markup or JSON. Combinators, selector lists, :not, :is and :has, all client-side.',
});

const page = () => <CssSelectorExtractor />;
export default page;
