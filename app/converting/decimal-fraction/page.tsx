import { DecimalToFraction } from '@/Components/Functions/DecimalToFractionTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Decimal to Fraction Converter',
  description: 'Free online decimal to fraction converter. Convert any decimal number to its simplest fraction using GCD. Shows percentage, ratio, and continued fraction expansion. Handles repeating decimals. Instant Decimal to Fraction conversion.',
};

const page = () => <DecimalToFraction />;
export default page;
