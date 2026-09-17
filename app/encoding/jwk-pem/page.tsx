import { JwkPemConverter } from '@/Components/Functions/KeyTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/jwk-pem', {
  title: 'JWK to PEM Converter (and back)',
  description:
    'Convert a JSON Web Key to PEM and a PEM key to JWK. RSA, EC and OKP keys, public and private, with PKCS#8 output for private keys. Runs client-side.',
});

const page = () => <JwkPemConverter />;
export default page;
