import { XmlToCsv } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/xml-to-csv', { title: 'Online XML to CSV Converter', description: 'Free online XML to CSV converter. Convert tabular XML to CSV format instantly. Instant XML to CSV conversion.' });
const page = () => <XmlToCsv />;
export default page;
