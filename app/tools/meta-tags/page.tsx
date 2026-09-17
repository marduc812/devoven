import { MetaTagsGenerator } from '@/Components/Functions/MetaTagsTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/meta-tags', {
  title: 'HTML Meta Tags Generator - DevOven',
  description: 'Generate complete HTML meta tags for SEO, Open Graph (Facebook), and Twitter Card. Fill in your page details and copy the generated markup.',
});

const page = () => <MetaTagsGenerator />;
export default page;
