import { HtmlToJsxConverter } from '@/Components/Functions/HtmlToJsxTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTML to JSX Converter | DevOven',
  description: 'Convert HTML to JSX syntax. Converts class to className, for to htmlFor, inline styles to objects, self-closes void elements, and converts HTML comments to JSX comments. Instant HTML to JSX conversion.',
};

const page = () => <HtmlToJsxConverter />;
export default page;
