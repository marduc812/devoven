import { Ipv4ToInteger } from '@/Components/Functions/NetworkTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IPv4 to Integer Converter - DevOven',
  description: 'Convert IPv4 addresses to their 32-bit integer representation and back. Free online tool. Instant IPv4 to Integer conversion.',
};

const page = () => <Ipv4ToInteger />;
export default page;
