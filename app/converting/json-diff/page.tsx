import { JsonDiff } from '@/Components/Functions/ExtraConverters4';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-diff', {
  title: 'JSON Diff | DevOven',
  description: 'Compare two JSON objects and view the differences. Shows added, removed, and changed fields with path notation.',
});

const page = () => <JsonDiff />;
export default page;
