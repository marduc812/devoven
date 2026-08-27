import { MarkdownTableToCsv } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online Markdown Table to CSV Converter', description: 'Free online Markdown table to CSV converter. Convert Markdown tables to CSV instantly. Instant Markdown Table to CSV conversion.' };
const page = () => <MarkdownTableToCsv />;
export default page;
