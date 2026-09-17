import { CsvToXml } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/csv-to-xml', { title: 'Online CSV to XML Converter', description: 'Free online CSV to XML converter. Convert CSV rows to XML elements instantly. Instant CSV to XML conversion.' });
const page = () => <CsvToXml />;
export default page;
