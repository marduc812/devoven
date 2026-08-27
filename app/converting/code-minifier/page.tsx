import { CodeMinifier } from '@/Components/Functions/CodeMinifierTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Code Minifier | DevOven',
  description: 'Minify JavaScript or CSS code in the browser. Removes comments, collapses whitespace, and strips unnecessary characters. Auto-detects language. Shows original vs minified size.',
};

const page = () => <CodeMinifier />;
export default page;
