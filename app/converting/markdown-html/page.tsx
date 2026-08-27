import type { Metadata } from 'next';
import { MarkdownToHtml } from '@/Components/Functions/MarkdownToHtmlTools';

export const metadata: Metadata = {
  title: 'Markdown to HTML Converter | DevOven',
  description: 'Convert Markdown syntax to clean HTML instantly in your browser. Supports headings, bold, italic, code blocks, links, images, lists, blockquotes, and horizontal rules. Instant Markdown to HTML conversion.',
};

export default function Page() {
  return <MarkdownToHtml />;
}
