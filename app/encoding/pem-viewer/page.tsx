import { PemViewer } from '@/Components/Functions/PemViewerTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PEM Certificate Viewer - Inspect X.509 Certificates Online',
  description: 'View and inspect PEM-encoded X.509 certificates. Extract version, serial number, subject, issuer, validity dates, and basic constraints. All parsing done in your browser.',
};

const page = () => <PemViewer />;
export default page;
