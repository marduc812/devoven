import type { Metadata } from 'next';
import { XmlValidator } from '@/Components/Functions/XmlValidatorTools';

export const metadata: Metadata = {
  title: 'XML Validator | DevOven',
  description: 'Validate XML documents and view error details, or pretty-print XML for readability, all in your browser.',
};

const page = () => {
  return <XmlValidator />;
};

export default page;
