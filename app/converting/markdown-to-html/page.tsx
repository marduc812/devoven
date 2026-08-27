import { MarkdownToHtml } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online Markdown to HTML Converter', description: 'Free online Markdown to HTML converter. Convert Markdown syntax to HTML instantly. Instant Markdown to HTML conversion.' };
const page = () => <MarkdownToHtml />;
export default page;
