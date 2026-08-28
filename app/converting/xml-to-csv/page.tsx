import { XmlToCsv } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Online XML to CSV Converter', description: 'Free online XML to CSV converter. Convert tabular XML to CSV format instantly. Instant XML to CSV conversion.' };
const page = () => <XmlToCsv />;
export default page;
