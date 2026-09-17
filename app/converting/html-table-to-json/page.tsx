import { HtmlTableToJson } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/html-table-to-json', { title: 'Online HTML Table to JSON Converter', description: 'Free online HTML table to JSON converter. Extract any HTML table as a JSON array. Instant HTML Table to JSON conversion.' });
const page = () => <HtmlTableToJson />;
export default page;
