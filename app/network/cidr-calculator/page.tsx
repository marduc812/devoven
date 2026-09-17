import { CidrCalculator } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/cidr-calculator', {
  title: 'CIDR Calculator - DevOven',
  description: 'Calculate subnet details from CIDR notation: network address, broadcast, subnet mask, usable hosts, and more.',
});

const page = () => <CidrCalculator />;
export default page;
