import { CsvJsonConverter } from '@/Components/Functions/CsvJsonTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/csv-json', {
  title: 'CSV / JSON Converter — DevOven',
  description: 'Convert CSV to JSON or JSON to CSV. Auto-detects the input format. Handles quoted fields, commas in quotes, and escaped quotes. Instant CSV / JSON conversion.',
});

const page = () => <CsvJsonConverter />;
export default page;
