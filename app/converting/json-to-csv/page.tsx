import { JsonToCsv } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online JSON to CSV Converter',
  description: 'Free online JSON to CSV converter. Convert JSON arrays to CSV format instantly. Instant JSON to CSV conversion.',
};

const page = () => <JsonToCsv />;
export default page;
