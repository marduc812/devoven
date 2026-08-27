import { CsvToJson } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online CSV to JSON Converter',
  description: 'Free online CSV to JSON converter. Convert CSV data to JSON arrays instantly. Instant CSV to JSON conversion.',
};

const page = () => <CsvToJson />;
export default page;
