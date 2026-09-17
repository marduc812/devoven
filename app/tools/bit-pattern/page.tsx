import type { Metadata } from 'next';
import { BitPatternViewer } from '@/Components/Functions/BitPatternTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/bit-pattern', {
  title: 'Bit Pattern Viewer | DevOven',
  description: 'Visualize every byte of text or hex data as 8-bit binary patterns. Shows binary, hex, decimal, octal, MSB, LSB, bit count, and parity for each byte. Supports text (UTF-8) and raw hex input.',
});

export default function Page() {
  return <BitPatternViewer />;
}
