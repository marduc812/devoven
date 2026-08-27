import { RomanToArabic } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Roman to Arabic Numeral Converter',
  description: 'Free online Roman numeral to Arabic number converter. Convert Roman numerals like XIV or MMXXIV to integers instantly. Instant Roman to Arabic Numeral conversion.',
};

const page = () => <RomanToArabic />;
export default page;
