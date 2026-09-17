import { HtmlToJsxConverter } from '@/Components/Functions/HtmlToJsxTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/html-to-jsx', {
  title: 'HTML to JSX Converter | DevOven',
  description: 'Convert HTML to JSX syntax. Converts class to className, for to htmlFor, inline styles to objects, self-closes void elements, and converts HTML comments to JSX comments. Instant HTML to JSX conversion.',
});

const page = () => <HtmlToJsxConverter />;
export default page;
