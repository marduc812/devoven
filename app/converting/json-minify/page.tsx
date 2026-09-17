import { JsonMinify } from '@/Components/Functions/JsonMinifyTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-minify', {
  title: 'Online JSON Minifier & Beautifier',
  description: 'Free online JSON minifier and beautifier. Remove whitespace or format JSON with 2/4-space or tab indentation instantly.',
});

const page = () => <JsonMinify />;
export default page;
