import { ProtobufConverter } from '@/Components/Functions/ProtobufTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Protobuf Decoder', description: 'Decode protobuf binary blobs from hex or base64 without a schema. Shows field numbers, wire types, and interpreted values. Also generate .proto skeletons from JSON.' };
const page = () => <ProtobufConverter />;
export default page;
