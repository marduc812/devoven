import { DohSimulator } from '@/Components/Functions/DohSimulatorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DoH Query Builder — DevOven',
  description:
    'Build DNS-over-HTTPS (DoH) query URLs for Cloudflare, Google, and NextDNS. Generate curl examples and see the JSON response format. Supports A, AAAA, MX, TXT, CNAME, NS, SOA record types.',
};

const page = () => <DohSimulator />;
export default page;
