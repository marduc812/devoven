import { UrlBuilderTools } from '@/Components/Functions/UrlBuilderTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/url-builder', {
  title: 'URL Builder - Assemble a URL From Its Parts',
  description: 'Build a URL from its components: protocol, host, port, path, query parameters and hash. Enter one property per line and get a correctly encoded URL back.',
});

const page = () => <UrlBuilderTools />;
export default page;
