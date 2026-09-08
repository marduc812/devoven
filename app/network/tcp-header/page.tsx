import { TcpHeaderParser } from '@/Components/Functions/PacketTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TCP Header Parser - Decode Flags and Options',
  description:
    'Decode a TCP header from hex: ports, sequence and acknowledgement numbers, all nine flags, window, and the MSS, window scale, SACK and timestamp options. Client-side only.',
};

const page = () => <TcpHeaderParser />;
export default page;
