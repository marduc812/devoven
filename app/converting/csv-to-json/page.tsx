import { CsvToJson } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/csv-to-json', {
  title: 'Online CSV to JSON Converter',
  description: 'Free online CSV to JSON converter. Convert CSV data to JSON arrays instantly. Instant CSV to JSON conversion.',
});

const page = () => <CsvToJson />;
export default page;
