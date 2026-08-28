import { JsonToXml } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online JSON to XML Converter',
  description: 'Free online JSON to XML converter. Paste JSON and get XML instantly. Instant JSON to XML conversion.',
};

const page = () => <JsonToXml />;
export default page;
