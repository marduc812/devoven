import { JsonMergeTools } from '@/Components/Functions/JsonMergeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-merge', {
  title: 'JSON Merge - DevOven',
  description: 'Deep merge two JSON objects. Nested objects are merged recursively; arrays and primitives from the second object overwrite the first.',
});

const page = () => <JsonMergeTools />;
export default page;
