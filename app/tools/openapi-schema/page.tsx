import type { Metadata } from 'next';
import { OpenApiSchemaGenerator } from '@/Components/Functions/OpenApiSchemaTools';

export const metadata: Metadata = {
  title: 'OpenAPI Schema Generator | DevOven',
  description: 'Generate OpenAPI 3.0 schema definitions from JSON example objects with inferred types and required fields.',
};

const page = () => <OpenApiSchemaGenerator />;
export default page;
