import { EcdsaKeyPairGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ECDSA Key Pair Generator - P-256 / P-384 / P-521 | DevOven',
  description: 'Generate an ECDSA key pair with WebCrypto, entirely in your browser. PEM and JWK output for both halves. Nothing is sent to any server.',
};

const page = () => {
  return (
    <>
      <EcdsaKeyPairGenerator />
    </>
  );
};

export default page;
