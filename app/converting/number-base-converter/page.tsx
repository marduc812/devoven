import { NumberBaseConverter } from '@/Components/Functions/ExtraConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Number Base Converter',
  description: 'Convert numbers between binary, octal, decimal, hex, and other bases online for free. Instant Number Base conversion.',
};

const page = () => <NumberBaseConverter />;
export default page;
