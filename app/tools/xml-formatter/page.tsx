import { XmlFormatter } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/xml-formatter', {
  title: 'XML Formatter — DevOven',
  description: 'Pretty-print XML with configurable indentation online. Paste compact XML and get a clean, readable tree instantly.',
});

const page = () => (
  <>
    <XmlFormatter />
  </>
);

export default page;
