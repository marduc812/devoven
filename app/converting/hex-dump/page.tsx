import { HexDump } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/hex-dump', {
  title: 'Online Hex Dump Tool',
  description: 'Display text as a hex dump with offset, hex, and ASCII columns online for free.',
});

const page = () => <HexDump />;
export default page;
