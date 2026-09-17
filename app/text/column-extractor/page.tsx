import type { Metadata } from 'next';
import { ColumnExtractor } from '@/Components/Functions/TextTools2';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/column-extractor', {
  title: 'Column Extractor | DevOven',
  description: 'Extract specific columns from CSV, TSV, or space-separated text instantly in your browser.',
});

const page = () => {
  return <ColumnExtractor />;
};

export default page;
