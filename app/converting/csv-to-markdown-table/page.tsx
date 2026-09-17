import { CsvToMarkdownTable } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/csv-to-markdown-table', { title: 'Online CSV to Markdown Table Converter', description: 'Free online CSV to Markdown table converter. Instantly format CSV as a Markdown table. Instant CSV to Markdown Table conversion.' });
const page = () => <CsvToMarkdownTable />;
export default page;
