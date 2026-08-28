import { BasicAuthEncoderDecoder } from '@/Components/Functions/BasicAuthTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTTP Basic Auth Encoder / Decoder | DevOven',
  description: 'Encode username and password into HTTP Basic Authentication headers, or decode a Basic auth token back to credentials.',
};

const page = () => <BasicAuthEncoderDecoder />;
export default page;
