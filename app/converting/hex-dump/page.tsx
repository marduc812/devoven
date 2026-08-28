import { HexDump } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Hex Dump Tool',
  description: 'Display text as a hex dump with offset, hex, and ASCII columns online for free.',
};

const page = () => <HexDump />;
export default page;
