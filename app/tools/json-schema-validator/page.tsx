import { JsonSchemaValidator } from '@/Components/Functions/JsonSchemaTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-schema-validator', {
  title: 'JSON Schema Validator — DevOven',
  description: 'Validate a JSON document against a JSON Schema (draft-07). Supports type, required, properties, enum, minimum, maximum, minLength, maxLength, pattern, and items validation.',
});

const page = () => (
  <>
    <JsonSchemaValidator />
  </>
);

export default page;
