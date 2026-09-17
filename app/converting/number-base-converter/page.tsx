import { NumberBaseConverter } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/number-base-converter', {
  title: 'Online Number Base Converter',
  description: 'Convert numbers between binary, octal, decimal, hex, and other bases online for free. Instant Number Base conversion.',
});

const page = () => <NumberBaseConverter />;
export default page;
