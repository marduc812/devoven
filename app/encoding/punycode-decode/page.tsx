import { PunycodeDecode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Punycode Decoder',
  description: 'Free online Punycode decoder. Convert Punycode-encoded domain names back to Unicode.',
};

const page = () => <PunycodeDecode />;
export default page;
