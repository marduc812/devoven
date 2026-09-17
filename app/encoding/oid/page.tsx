import { OidLookupTool } from '@/Components/Functions/KeyTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/oid', {
  title: 'OID to Hex Converter & Lookup',
  description:
    'Convert an object identifier between its dotted form and its DER encoding, in either direction, and look up what a known OID means. Free and client-side.',
});

const page = () => <OidLookupTool />;
export default page;
