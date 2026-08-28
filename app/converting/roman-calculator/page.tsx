import { RomanCalculator } from '@/Components/Functions/RomanCalculatorTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roman Numeral Calculator | DevOven',
  description: 'Perform arithmetic with roman numerals. Add, subtract, multiply, and divide roman numeral expressions directly in your browser.',
};

const page = () => <RomanCalculator />;
export default page;
