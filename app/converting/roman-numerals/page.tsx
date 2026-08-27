import type { Metadata } from 'next';
import { RomanNumerals } from '@/Components/Functions/RomanNumeralsTools';

export const metadata: Metadata = {
  title: 'Roman Numeral Converter | DevOven',
  description: 'Convert between Roman numerals and Arabic integers (1–3999). Auto-detects input direction, validates format, shows conversion steps and reference table.',
};

export default function Page() {
  return <RomanNumerals />;
}
