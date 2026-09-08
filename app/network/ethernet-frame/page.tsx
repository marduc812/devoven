import { EthernetFrameParser } from '@/Components/Functions/PacketTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ethernet Frame Parser - Decode Frame Hex',
  description:
    'Decode an Ethernet II frame from hex bytes: MAC addresses, VLAN tags and EtherType, and on into the IPv4 and TCP headers underneath. Runs entirely in your browser.',
};

const page = () => <EthernetFrameParser />;
export default page;
