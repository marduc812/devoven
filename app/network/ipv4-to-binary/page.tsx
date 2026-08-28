import { Ipv4ToBinary } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IPv4 to Binary Converter - DevOven',
  description: 'Convert IPv4 addresses to binary notation and back. Free online tool. Instant IPv4 to Binary conversion.',
};

const page = () => <Ipv4ToBinary />;
export default page;
