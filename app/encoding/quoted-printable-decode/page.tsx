import { QuotedPrintableDecode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Quoted-Printable Decoder',
  description: 'Free online Quoted-Printable decoder. Decode RFC 2045 Quoted-Printable text back to plain text.',
};

const page = () => <QuotedPrintableDecode />;
export default page;
