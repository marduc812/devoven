import { CssFormatter } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/css-formatter', {
  title: 'CSS Formatter & Minifier — DevOven',
  description: 'Format or minify CSS online using Prettier. Clean up your stylesheets or compress them for production.',
});

const page = () => (
  <>
    <CssFormatter />
  </>
);

export default page;
