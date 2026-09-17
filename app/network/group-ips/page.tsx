import { GroupIpAddresses } from '@/Components/Functions/IpGroupTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/group-ips', {
  title: 'Group IP Addresses into CIDR Blocks',
  description:
    'Collapse a list of IPv4 addresses, ranges and netmasks into the smallest set of CIDR blocks covering exactly the same addresses. Free, in-browser, nothing uploaded.',
});

const page = () => <GroupIpAddresses />;
export default page;
