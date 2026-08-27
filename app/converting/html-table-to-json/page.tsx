import { HtmlTableToJson } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online HTML Table to JSON Converter', description: 'Free online HTML table to JSON converter. Extract any HTML table as a JSON array. Instant HTML Table to JSON conversion.' };
const page = () => <HtmlTableToJson />;
export default page;
