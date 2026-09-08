import { CborDecoder } from '@/Components/Functions/BinaryFormatTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CBOR Decoder - Convert CBOR to JSON',
  description:
    'Decode CBOR (RFC 8949) bytes to readable JSON in your browser. Handles indefinite lengths, half floats, bignums, byte strings and tags, from hex or Base64 input.',
};

const page = () => <CborDecoder />;
export default page;
