import { RomanCalculator } from '@/Components/Functions/RomanCalculatorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/roman-calculator', {
  title: 'Roman Numeral Calculator | DevOven',
  description: 'Perform arithmetic with roman numerals. Add, subtract, multiply, and divide roman numeral expressions directly in your browser.',
});

const page = () => <RomanCalculator />;
export default page;
