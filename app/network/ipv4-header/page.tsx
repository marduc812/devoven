import { Ipv4HeaderParser } from '@/Components/Functions/PacketTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/ipv4-header', {
  title: 'IPv4 Header Parser & Checksum Verifier',
  description:
    'Decode an IPv4 header from hex: version, IHL, DSCP and ECN, flags, fragment offset, TTL, protocol, addresses and options, with the header checksum recomputed and verified.',
});

const page = () => <Ipv4HeaderParser />;
export default page;
