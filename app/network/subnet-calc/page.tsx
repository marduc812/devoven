import type { Metadata } from 'next';
import { SubnetCalc } from '@/Components/Functions/SubnetCalcTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/subnet-calc', {
  title: 'IP Subnet Calculator | DevOven',
  description: 'Calculate IPv4 subnet details from CIDR notation. Enter an IP/prefix to get network address, broadcast, subnet mask, wildcard mask, first/last host, and usable host count.',
});

export default function Page() {
  return <SubnetCalc />;
}
