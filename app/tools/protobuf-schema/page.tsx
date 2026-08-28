import type { Metadata } from 'next';
import { ProtobufSchemaBuilder } from '@/Components/Functions/ProtobufTools';

export const metadata: Metadata = {
  title: 'Protobuf Schema Builder | DevOven',
  description: 'Generate a Protocol Buffers v3 .proto schema from a JSON example object. Infers types, handles nested messages, and outputs valid proto3 syntax.',
};

export default function Page() {
  return <ProtobufSchemaBuilder />;
}
