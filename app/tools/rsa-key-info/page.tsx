import type { Metadata } from 'next';
import { RsaKeyInfo } from '@/Components/Functions/RsaKeyInfoTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/rsa-key-info', {
  title: 'RSA Key Info Parser | DevOven',
  description: 'Parse PEM-encoded RSA public/private keys and certificates to inspect key type, size in bits, modulus, public exponent, and ASN.1 structure. All processing is client-side.',
});

export default function Page() {
  return <RsaKeyInfo />;
}
