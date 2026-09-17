import type { Metadata } from 'next';
import { BaseConverter } from '@/Components/Functions/BaseConvertTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/base-convert', {
  title: 'Base Converter Extended — Binary, Octal, Hex, Base36 | DevOven',
  description: 'Convert numbers between any base from 2 to 36 simultaneously. See binary, octal, decimal, hexadecimal, base32, and base36 output at once. Instant number base conversion.',
});

export default function Page() {
  return <BaseConverter />;
}
