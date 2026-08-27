import { RsaKeyPairGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RSA Key Pair Generator — 2048 / 4096-bit | DevOven',
  description: 'Generate RSA public/private key pairs in PEM format using WebCrypto, entirely in your browser. Nothing is sent to any server.',
};

const page = () => {
  return (
    <>
      <RsaKeyPairGenerator />
    </>
  );
};

export default page;
