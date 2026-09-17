import { JsonSchemaGenerator } from '@/Components/Functions/JsonSchemaGenTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/json-schema', { title: 'JSON Schema Generator', description: 'Generate a JSON Schema (Draft 7) from a JSON example. Detects types, required fields, formats, nested objects and arrays.' });
const page = () => <JsonSchemaGenerator />;
export default page;
