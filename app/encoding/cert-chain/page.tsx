import { CertChainAnalyzer } from '@/Components/Functions/CertChainTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certificate Chain Analyzer - DevOven',
  description: 'Analyze X.509 certificate chains. Paste multiple PEM certificates to see leaf, intermediate, and root roles, and verify chain ordering.',
};

const page = () => <CertChainAnalyzer />;
export default page;
