import type { Metadata } from 'next';
import { SamlDecoder } from '@/Components/Functions/SamlDecoderTools';

export const metadata: Metadata = {
  title: 'SAML Request Decoder | DevOven',
  description: 'Decode base64-encoded SAML requests and responses. Supports HTTP-Redirect (deflate+base64) and HTTP-POST bindings. Extracts fields like ID, Issuer, Destination, NameID, and StatusCode.',
};

export default function Page() {
  return <SamlDecoder />;
}
