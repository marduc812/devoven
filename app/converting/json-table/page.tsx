import { JsonTableConverter } from '@/Components/Functions/JsonTableTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-table', {
  title: 'JSON to ASCII Table - DevOven',
  description: 'Convert a JSON array of objects into a formatted ASCII table. Each object key becomes a column header.',
});

const page = () => <JsonTableConverter />;
export default page;
