import { Ipv6Tool } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/ipv6', {
  title: 'IPv6 Expander / Compressor - DevOven',
  description: 'Expand compressed IPv6 addresses to full notation or compress them using :: shorthand. Free online tool.',
});

const page = () => <Ipv6Tool />;
export default page;
