import { ArabicToRoman } from '@/Components/Functions/NumberUnitConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/arabic-to-roman', {
  title: 'Online Arabic to Roman Numeral Converter',
  description: 'Free online Arabic to Roman numeral converter. Convert integers like 2024 to Roman numerals like MMXXIV instantly. Instant Arabic to Roman Numeral conversion.',
});

const page = () => <ArabicToRoman />;
export default page;
