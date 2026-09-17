import type { Metadata } from 'next';
import { DataTypeAnalyzer } from '@/Components/Functions/DataTypeAnalyzerTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/data-type-analyzer', {
  title: 'Data Type Analyzer | DevOven',
  description: 'Analyze CSV data to infer column types (integer, float, boolean, date, email, URL, categorical, free text). Useful for data cleaning and schema design.',
});

export default function Page() {
  return <DataTypeAnalyzer />;
}
