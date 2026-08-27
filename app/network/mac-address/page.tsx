import { MacAddressTools } from '@/Components/Functions/MacAddressTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MAC Address Tools - DevOven',
  description: 'Validate, format, and inspect MAC addresses. Convert between colon, dash, dot, and plain formats. Detect OUI, multicast, locally administered, and broadcast addresses.',
};

const page = () => <MacAddressTools />;
export default page;
