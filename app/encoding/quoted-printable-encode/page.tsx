import { QuotedPrintableEncode } from '@/Components/Functions/EncodingTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/quoted-printable-encode', {
  title: 'Online Quoted-Printable Encoder',
  description: 'Free online Quoted-Printable encoder (RFC 2045). Encode text with non-ASCII characters for email compatibility.',
});

const page = () => <QuotedPrintableEncode />;
export default page;
