import { OpenApiSnippet } from '@/Components/Functions/OpenApiTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'OpenAPI Snippet Generator', description: 'Generate OpenAPI 3.0 YAML and JSON snippets from a simple endpoint description.' };
const page = () => <OpenApiSnippet />;
export default page;
