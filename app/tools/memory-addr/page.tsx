import type { Metadata } from 'next';
import { MemoryAddrCalculator } from '@/Components/Functions/MemoryAddrTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/memory-addr', {
  title: 'Memory Address Calculator | DevOven',
  description: 'Calculate memory addresses from base + offset, check alignment, compute page numbers for 4KB/2MB/1GB pages, and find the distance between two addresses.',
});

export default function Page() {
  return <MemoryAddrCalculator />;
}
