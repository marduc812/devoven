import { MessagePackDecoder } from '@/Components/Functions/BinaryFormatTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/messagepack', {
  title: 'MessagePack to JSON Converter',
  description:
    'Decode MessagePack bytes to JSON in your browser. Every type from fixint to 64-bit integers, bin, str, maps, arrays and extensions including timestamps.',
});

const page = () => <MessagePackDecoder />;
export default page;
