import { CidrCalculator } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CIDR Calculator - DevOven',
  description: 'Calculate subnet details from CIDR notation: network address, broadcast, subnet mask, usable hosts, and more.',
};

const page = () => <CidrCalculator />;
export default page;
