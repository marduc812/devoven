import { UdpHeaderParser } from '@/Components/Functions/PacketTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UDP Header Parser - Decode Datagram Hex',
  description:
    'Decode a UDP header from hex bytes: source and destination ports with their well-known names, the datagram length checked against your paste, and the checksum.',
};

const page = () => <UdpHeaderParser />;
export default page;
