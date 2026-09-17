import { QuotedPrintableDecode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/quoted-printable-decode', {
  title: 'Online Quoted-Printable Decoder',
  description: 'Free online Quoted-Printable decoder. Decode RFC 2045 Quoted-Printable text back to plain text.',
});

const page = () => <QuotedPrintableDecode />;
export default page;
