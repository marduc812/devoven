import { BitfieldViewer } from '@/Components/Functions/BitfieldTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/bitfield', {
  title: 'Bitfield Viewer | DevOven',
  description: 'Visualize any number as a 32-bit bitfield. See individual bits, byte breakdown, and set/clear bit counts for decimal or hex input.',
});

const page = () => <BitfieldViewer />;
export default page;
