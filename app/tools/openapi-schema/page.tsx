import type { Metadata } from 'next';
import { OpenApiSchemaGenerator } from '@/Components/Functions/OpenApiSchemaTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/openapi-schema', {
  title: 'OpenAPI Schema Generator | DevOven',
  description: 'Generate OpenAPI 3.0 schema definitions from JSON example objects with inferred types and required fields.',
});

const page = () => <OpenApiSchemaGenerator />;
export default page;
