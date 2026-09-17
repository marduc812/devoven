import { QuotedPrintableConverter } from '@/Components/Functions/QuotedPrintableTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/quoted-printable', {
  title: 'Online Quoted-Printable Encoder & Decoder',
  description: 'Free online Quoted-Printable encoder and decoder (RFC 2045). Encode text to QP format with =XX sequences and soft line breaks, or decode back to plain text. Auto-detects direction.',
});

const page = () => <QuotedPrintableConverter />;
export default page;
