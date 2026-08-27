import { NumeralSystems } from '@/Components/Functions/NumeralSystemsTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Numeral Systems Reference — DevOven',
  description: 'Convert any number to decimal, binary, octal, hex, base-36, Roman numerals, scientific notation, English words, IEEE 754, and fraction. Includes a reference table for the first 256 values.',
};

const page = () => <NumeralSystems />;
export default page;
