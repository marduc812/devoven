import { MarkdownPreview } from '@/Components/Functions/MarkdownPreviewTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/markdown-preview', {
  title: 'Markdown Preview - DevOven',
  description: 'Live Markdown editor with side-by-side HTML preview. Write or paste Markdown and instantly see the rendered result.',
});

const page = () => <MarkdownPreview />;
export default page;
