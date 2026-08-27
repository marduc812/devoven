import { HtmlToMarkdown } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online HTML to Markdown Converter', description: 'Free online HTML to Markdown converter. Convert HTML to Markdown syntax instantly. Instant HTML to Markdown conversion.' };
const page = () => <HtmlToMarkdown />;
export default page;
