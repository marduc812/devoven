import { TextToHtmlTable } from '@/Components/Functions/TextToHtmlTableTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/text-to-html-table', {
  title: 'Text to HTML Table | DevOven',
  description: 'Convert CSV, TSV, pipe-separated, or semicolon-separated text to an HTML table. Supports auto-detection of delimiter and HTML escaping.',
});

const page = () => <TextToHtmlTable />;
export default page;
