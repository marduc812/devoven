import type { Metadata } from 'next';
import { EndiannessConverter } from '@/Components/Functions/EndiannessTools';

export const metadata: Metadata = {
  title: 'Endianness Converter | DevOven',
  description: 'Convert hex values between big-endian and little-endian byte order. Supports 16-bit, 32-bit, and 64-bit values with visual byte-order diagrams. Instant Endianness conversion.',
};

export default function Page() {
  return <EndiannessConverter />;
}
