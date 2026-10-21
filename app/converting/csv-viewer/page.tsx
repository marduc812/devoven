import type { Metadata } from 'next';
import CsvViewer from '@/Components/Functions/CsvViewer';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/csv-viewer', {
  title: 'CSV Viewer',
  description: 'View large CSV files as a table in your browser. Reads files in chunks and displays only the rows on screen.',
});

export default function Page() { return <CsvViewer />; }
