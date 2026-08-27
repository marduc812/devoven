import { TlsConfigGenerator } from '@/Components/Functions/TlsConfigTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TLS Config Generator — DevOven',
  description:
    'Generate TLS/SSL configuration snippets for nginx, Apache, and HAProxy based on Mozilla SSL Config Generator profiles. Choose modern (TLS 1.3 only), intermediate (TLS 1.2+), or old (legacy) profiles. Includes cipher suites, HSTS, OCSP stapling, and browser compatibility.',
};

const page = () => <TlsConfigGenerator />;
export default page;
