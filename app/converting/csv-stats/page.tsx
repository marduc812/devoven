import { CsvStats } from '@/Components/Functions/CsvStatsTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'CSV Column Statistics', description: 'Analyze CSV files: row count, column types, null counts, unique values, min/max/mean/median for numeric columns.' };
const page = () => <CsvStats />;
export default page;
