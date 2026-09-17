import { JsonFlattener } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-flatten', {
  title: 'Online JSON Flattener',
  description: 'Flatten nested JSON to dot-notation keys or unflatten back to nested structure.',
});

const page = () => <JsonFlattener />;
export default page;
