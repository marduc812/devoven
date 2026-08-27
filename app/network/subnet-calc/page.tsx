import type { Metadata } from 'next';
import { SubnetCalc } from '@/Components/Functions/SubnetCalcTools';

export const metadata: Metadata = {
  title: 'IP Subnet Calculator | DevOven',
  description: 'Calculate IPv4 subnet details from CIDR notation. Enter an IP/prefix to get network address, broadcast, subnet mask, wildcard mask, first/last host, and usable host count.',
};

export default function Page() {
  return <SubnetCalc />;
}
