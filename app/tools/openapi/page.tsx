import { OpenApiSnippet } from '@/Components/Functions/OpenApiTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/tools/openapi', { title: 'OpenAPI Snippet Generator', description: 'Generate OpenAPI 3.0 YAML and JSON snippets from a simple endpoint description.' });
const page = () => <OpenApiSnippet />;
export default page;
