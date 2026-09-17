import { TlsCipherDecoder } from '@/Components/Functions/TlsCipherTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/tls-cipher', {
  title: 'TLS Cipher Suite Decoder - DevOven',
  description: 'Decode TLS cipher suite names to see key exchange, authentication, encryption algorithm, mode, key size, and MAC. Identifies forward secrecy and AEAD suites.',
});

const page = () => <TlsCipherDecoder />;
export default page;
