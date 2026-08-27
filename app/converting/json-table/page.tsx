import { JsonTableConverter } from '@/Components/Functions/JsonTableTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to ASCII Table - DevOven',
  description: 'Convert a JSON array of objects into a formatted ASCII table. Each object key becomes a column header.',
};

const page = () => <JsonTableConverter />;
export default page;
