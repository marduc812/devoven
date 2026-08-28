import { JsonMergeTools } from '@/Components/Functions/JsonMergeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Merge - DevOven',
  description: 'Deep merge two JSON objects. Nested objects are merged recursively; arrays and primitives from the second object overwrite the first.',
};

const page = () => <JsonMergeTools />;
export default page;
