import { PublicKeyExtractor } from '@/Components/Functions/KeyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extract a Public Key from a Certificate or Private Key',
  description:
    'Get the public key out of an X.509 certificate, a CSR, or an RSA or EC private key in PKCS#8, PKCS#1 or SEC1 form. Outputs a PUBLIC KEY PEM, entirely in your browser.',
};

const page = () => <PublicKeyExtractor />;
export default page;
