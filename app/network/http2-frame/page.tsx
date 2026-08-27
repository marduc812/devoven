import { Http2FrameDecoder } from '@/Components/Functions/Http2FrameTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTTP/2 Frame Decoder - DevOven',
  description: 'Decode HTTP/2 frames from hex bytes (RFC 7540). Parse frame headers, flags, stream IDs and payloads. Reference for all frame types and error codes.',
};

const page = () => <Http2FrameDecoder />;
export default page;
