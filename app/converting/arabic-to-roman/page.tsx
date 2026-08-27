import { ArabicToRoman } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Arabic to Roman Numeral Converter',
  description: 'Free online Arabic to Roman numeral converter. Convert integers like 2024 to Roman numerals like MMXXIV instantly. Instant Arabic to Roman Numeral conversion.',
};

const page = () => <ArabicToRoman />;
export default page;
