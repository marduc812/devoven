import { BinaryToDecimal } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Binary to Decimal Converter',
  description: 'Free online binary to decimal converter. Enter a binary number and get the decimal equivalent instantly. Instant Binary to Decimal conversion.',
};

const page = () => <BinaryToDecimal />;
export default page;
