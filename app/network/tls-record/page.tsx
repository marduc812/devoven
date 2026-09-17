import { TlsRecordParser } from '@/Components/Functions/PacketTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/tls-record', {
  title: 'TLS Record Parser - Decode ClientHello, Alerts',
  description:
    'Decode the TLS record layer from hex: content type, version and length for every record, plus ClientHello cipher suites, SNI, ALPN and supported versions, and Alert descriptions.',
});

const page = () => <TlsRecordParser />;
export default page;
