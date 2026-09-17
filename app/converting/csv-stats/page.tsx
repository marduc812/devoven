import { CsvStats } from '@/Components/Functions/CsvStatsTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/csv-stats', { title: 'CSV Column Statistics', description: 'Analyze CSV files: row count, column types, null counts, unique values, min/max/mean/median for numeric columns.' });
const page = () => <CsvStats />;
export default page;
