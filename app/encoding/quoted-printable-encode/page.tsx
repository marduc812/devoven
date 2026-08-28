import { QuotedPrintableEncode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Quoted-Printable Encoder',
  description: 'Free online Quoted-Printable encoder (RFC 2045). Encode text with non-ASCII characters for email compatibility.',
};

const page = () => <QuotedPrintableEncode />;
export default page;
