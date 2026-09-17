import type { Metadata } from 'next';
import { ProtobufWireDecoder } from '@/Components/Functions/ProtobufWireTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/protobuf-wire', {
  title: 'Protocol Buffer Wire Format | DevOven',
  description: 'Decode protobuf hex bytes to reveal wire types (varint, 64-bit, length-delimited, 32-bit), field numbers, varint decoding steps, and payload data.',
});

export default function Page() {
  return <ProtobufWireDecoder />;
}
