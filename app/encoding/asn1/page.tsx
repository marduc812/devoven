import { Asn1Parser } from '@/Components/Functions/KeyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ASN.1 DER Parser & Decoder',
  description:
    'Decode ASN.1 DER from a PEM block, Base64 or hex. Named tags, resolved OIDs, decoded integers and strings, byte offsets, and nested DER unwrapped. Runs in your browser.',
};

const page = () => <Asn1Parser />;
export default page;
