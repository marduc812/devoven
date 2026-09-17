import { JsonLint } from '@/Components/Functions/JsonLintTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-lint', {
  title: 'JSON Lint - JSON Validator',
  description:
    'Free online JSON linter and validator. Validate JSON and get friendly error messages with line and column information. Instantly check if your JSON is valid.',
});

const page = () => <JsonLint />;
export default page;
