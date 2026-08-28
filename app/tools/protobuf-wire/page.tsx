import type { Metadata } from 'next';
import { ProtobufWireDecoder } from '@/Components/Functions/ProtobufWireTools';

export const metadata: Metadata = {
  title: 'Protocol Buffer Wire Format | DevOven',
  description: 'Decode protobuf hex bytes to reveal wire types (varint, 64-bit, length-delimited, 32-bit), field numbers, varint decoding steps, and payload data.',
};

export default function Page() {
  return <ProtobufWireDecoder />;
}
