import { SubnetListGenerator } from '@/Components/Functions/SubnetListTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subnet List Generator - DevOven',
  description: 'Split a CIDR block into subnets. Enter a network like 192.168.1.0/24 and split into /25, /26, etc. to view all subnets with network address, broadcast, and host ranges.',
};

const page = () => <SubnetListGenerator />;
export default page;
