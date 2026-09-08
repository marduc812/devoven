import { JwkPemConverter } from '@/Components/Functions/KeyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWK to PEM Converter (and back)',
  description:
    'Convert a JSON Web Key to PEM and a PEM key to JWK. RSA, EC and OKP keys, public and private, with PKCS#8 output for private keys. Runs client-side.',
};

const page = () => <JwkPemConverter />;
export default page;
