import { TlsRecordParser } from '@/Components/Functions/PacketTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TLS Record Parser - Decode ClientHello, Alerts',
  description:
    'Decode the TLS record layer from hex: content type, version and length for every record, plus ClientHello cipher suites, SNI, ALPN and supported versions, and Alert descriptions.',
};

const page = () => <TlsRecordParser />;
export default page;
