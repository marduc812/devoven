import { HtmlTableToCsv } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online HTML Table to CSV Converter', description: 'Free online HTML table to CSV converter. Extract any HTML table as CSV instantly. Instant HTML Table to CSV conversion.' };
const page = () => <HtmlTableToCsv />;
export default page;
