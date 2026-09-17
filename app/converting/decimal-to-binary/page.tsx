import { DecimalToBinary } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/decimal-to-binary', {
  title: 'Online Decimal to Binary Converter',
  description: 'Free online decimal to binary converter. Enter a decimal integer and get the binary representation instantly. Instant Decimal to Binary conversion.',
});

const page = () => <DecimalToBinary />;
export default page;
