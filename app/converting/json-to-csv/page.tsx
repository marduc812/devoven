import { JsonToCsv } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-to-csv', {
  title: 'Online JSON to CSV Converter',
  description: 'Free online JSON to CSV converter. Convert JSON arrays to CSV format instantly. Instant JSON to CSV conversion.',
});

const page = () => <JsonToCsv />;
export default page;
