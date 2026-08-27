import { Ipv6Tool } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IPv6 Expander / Compressor - DevOven',
  description: 'Expand compressed IPv6 addresses to full notation or compress them using :: shorthand. Free online tool.',
};

const page = () => <Ipv6Tool />;
export default page;
