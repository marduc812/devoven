import { CsrParser } from '@/Components/Functions/KeyTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/csr', {
  title: 'CSR Parser - Decode a Certificate Signing Request',
  description:
    'Decode a PKCS#10 CSR in your browser: subject, signature algorithm, key size, subject alternative names and the public key inside it. Nothing is uploaded.',
});

const page = () => <CsrParser />;
export default page;
