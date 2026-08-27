import { JsonFormatter } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Formatter & Validator — DevOven',
  description: 'Format, pretty-print, and validate JSON online. Paste any JSON to get a clean, indented result with instant error detection.',
};

const page = () => (
  <>
    <JsonFormatter />
  </>
);

export default page;
