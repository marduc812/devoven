import type { Metadata } from 'next';
import { ColumnExtractor } from '@/Components/Functions/TextTools2';

export const metadata: Metadata = {
  title: 'Column Extractor | DevOven',
  description: 'Extract specific columns from CSV, TSV, or space-separated text instantly in your browser.',
};

const page = () => {
  return <ColumnExtractor />;
};

export default page;
