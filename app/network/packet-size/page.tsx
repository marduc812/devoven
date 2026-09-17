import { PacketSizeCalculator } from '@/Components/Functions/PacketSizeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/packet-size', {
  title: 'Packet Size Calculator - DevOven',
  description: 'Calculate total network packet sizes including protocol headers (Ethernet, IPv4, IPv6, TCP, UDP, HTTP). Analyze MTU fragmentation.',
});

const page = () => <PacketSizeCalculator />;
export default page;
