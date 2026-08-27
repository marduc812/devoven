import { JsonSchemaValidator } from '@/Components/Functions/JsonSchemaTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Schema Validator — DevOven',
  description: 'Validate a JSON document against a JSON Schema (draft-07). Supports type, required, properties, enum, minimum, maximum, minLength, maxLength, pattern, and items validation.',
};

const page = () => (
  <>
    <JsonSchemaValidator />
  </>
);

export default page;
