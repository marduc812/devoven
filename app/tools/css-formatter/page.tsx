import { CssFormatter } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CSS Formatter & Minifier — DevOven',
  description: 'Format or minify CSS online using Prettier. Clean up your stylesheets or compress them for production.',
};

const page = () => (
  <>
    <CssFormatter />
  </>
);

export default page;
